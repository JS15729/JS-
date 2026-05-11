import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { FileChunk, FileChunkDocument } from '../schemas/file-chunk.schema';
import { File, FileDocument } from '../schemas/file.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { ConfigService } from '../config/config.service';

@Injectable()
export class UploadService {
  constructor(
    @InjectModel(FileChunk.name) private chunkModel: Model<FileChunkDocument>,
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  /**
   * 初始化分片上传
   */
  async initUpload(userId: string, dto: {
    file_name: string;
    file_size: number;
    file_hash: string;
    mime_type: string;
    total_chunks: number;
    chunk_size: number;
    folder_id?: string;
  }) {
    // 检查用户存储空间
    const user = await this.userModel.findById(userId);
    if (user.storage_used + dto.file_size > user.storage_quota) {
      throw new BadRequestException('存储空间不足');
    }

    // 检查是否有已存在的上传
    const existingChunks = await this.chunkModel.find({ file_hash: dto.file_hash });
    const uploadedChunks = existingChunks.map(c => c.chunk_index);

    const uploadId = uuidv4();

    return {
      upload_id: uploadId,
      uploaded_chunks: uploadedChunks,
      total_chunks: dto.total_chunks,
      chunk_size: this.configService.chunkSize,
    };
  }

  /**
   * 上传单个分片
   */
  async uploadChunk(
    userId: string,
    file: Express.Multer.File,
    dto: {
      upload_id: string;
      file_hash: string;
      chunk_index: number;
      total_chunks: number;
    },
  ) {
    if (!file) {
      throw new BadRequestException('未收到文件分片');
    }

    const chunkDir = path.resolve(this.configService.uploadDir, 'chunks', dto.file_hash);
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    const chunkPath = path.join(chunkDir, `${dto.chunk_index}`);

    // 移动上传的分片到分片目录
    fs.renameSync(file.path, chunkPath);

    // 记录分片信息
    const existing = await this.chunkModel.findOne({
      file_hash: dto.file_hash,
      chunk_index: dto.chunk_index,
    });

    if (existing) {
      existing.size = file.size;
      existing.upload_id = dto.upload_id;
      await existing.save();
    } else {
      await this.chunkModel.create({
        file_hash: dto.file_hash,
        chunk_index: dto.chunk_index,
        chunk_path: chunkPath,
        size: file.size,
        upload_id: dto.upload_id,
      });
    }

    // 检查所有分片是否上传完成
    const allChunks = await this.chunkModel.find({ file_hash: dto.file_hash });
    const uniqueChunks = [...new Set(allChunks.map(c => c.chunk_index))];

    return {
      chunk_index: dto.chunk_index,
      received: uniqueChunks.length,
      total: dto.total_chunks,
      completed: uniqueChunks.length >= dto.total_chunks,
    };
  }

  /**
   * 合并所有分片
   */
  async mergeChunks(userId: string, dto: {
    upload_id: string;
    file_hash: string;
    file_name: string;
    mime_type: string;
    total_chunks: number;
    folder_id?: string;
    tags?: string[];
  }) {
    const chunkDir = path.resolve(this.configService.uploadDir, 'chunks', dto.file_hash);

    if (!fs.existsSync(chunkDir)) {
      throw new NotFoundException('分片数据不存在');
    }

    // 验证所有分片
    const chunks = await this.chunkModel.find({ file_hash: dto.file_hash }).sort({ chunk_index: 1 });
    const uniqueChunks = [...new Set(chunks.map(c => c.chunk_index))];

    if (uniqueChunks.length < dto.total_chunks) {
      throw new BadRequestException(`分片不完整，已上传 ${uniqueChunks.length}/${dto.total_chunks}`);
    }

    // 生成存储文件名
    const ext = path.extname(dto.file_name);
    const storageName = `${uuidv4()}${ext}`;

    // 按日期组织存储目录
    const dateDir = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    const storeDir = path.resolve(this.configService.uploadDir, 'files', dateDir);
    if (!fs.existsSync(storeDir)) {
      fs.mkdirSync(storeDir, { recursive: true });
    }

    const finalPath = path.join(storeDir, storageName);
    const writeStream = fs.createWriteStream(finalPath);

    // 按序合并分片
    for (let i = 0; i < dto.total_chunks; i++) {
      const chunkPath = path.join(chunkDir, `${i}`);

      if (!fs.existsSync(chunkPath)) {
        writeStream.close();
        // 清理
        try { fs.unlinkSync(finalPath); } catch (e) { /* ignore */ }
        throw new NotFoundException(`分片 ${i} 数据丢失`);
      }

      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
    }

    writeStream.end();

    // 等待写入完成
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // 计算最终文件大小
    const finalStats = fs.statSync(finalPath);
    const finalSize = finalStats.size;

    // 创建文件记录
    const fileRecord = new this.fileModel({
      name: dto.file_name,
      original_name: dto.file_name,
      size: finalSize,
      mime_type: dto.mime_type,
      hash: dto.file_hash,
      folder_id: dto.folder_id ? new Types.ObjectId(dto.folder_id) : null,
      owner_id: new Types.ObjectId(userId),
      storage_path: finalPath,
      tags: dto.tags || [],
    });
    await fileRecord.save();

    // 更新用户存储空间
    await this.userModel.findByIdAndUpdate(userId, { $inc: { storage_used: finalSize } });

    // 清理分片数据
    await this.cleanupChunks(dto.file_hash, chunkDir);

    return fileRecord;
  }

  /**
   * 简单文件上传（小文件，不分片）
   */
  async simpleUpload(userId: string, file: Express.Multer.File, folderId?: string) {
    if (!file) {
      throw new BadRequestException('未收到文件');
    }

    // 计算哈希
    const fileBuffer = fs.readFileSync(file.path);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    // 去重检查
    const existing = await this.fileModel.findOne({
      hash,
      owner_id: new Types.ObjectId(userId),
      is_deleted: false,
    });
    if (existing) {
      fs.unlinkSync(file.path);
      return { ...existing.toObject(), deduplicated: true, message: '文件已存在，已自动去重' };
    }

    // 存储 - 修复中文文件名编码问题
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName);
    const storageName = `${uuidv4()}${ext}`;
    const dateDir = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    const storeDir = path.resolve(this.configService.uploadDir, 'files', dateDir);
    if (!fs.existsSync(storeDir)) {
      fs.mkdirSync(storeDir, { recursive: true });
    }

    const finalPath = path.join(storeDir, storageName);
    fs.renameSync(file.path, finalPath);

    const fileRecord = new this.fileModel({
      name: originalName,
      original_name: originalName,
      size: file.size,
      mime_type: file.mimetype,
      hash,
      folder_id: folderId ? new Types.ObjectId(folderId) : null,
      owner_id: new Types.ObjectId(userId),
      storage_path: finalPath,
    });
    await fileRecord.save();

    await this.userModel.findByIdAndUpdate(userId, { $inc: { storage_used: file.size } });

    return fileRecord;
  }

  /**
   * 获取上传进度
   */
  async getProgress(uploadId: string, fileHash: string, totalChunks: number) {
    const chunks = await this.chunkModel.find({
      upload_id: uploadId,
      file_hash: fileHash,
    });
    const uniqueIndices = [...new Set(chunks.map(c => c.chunk_index))];
    return {
      upload_id: uploadId,
      file_hash: fileHash,
      uploaded: uniqueIndices.length,
      total: totalChunks,
      percentage: Math.round((uniqueIndices.length / totalChunks) * 100),
    };
  }

  private async cleanupChunks(fileHash: string, chunkDir: string) {
    // 删除数据库记录
    await this.chunkModel.deleteMany({ file_hash: fileHash });

    // 删除物理分片
    if (fs.existsSync(chunkDir)) {
      fs.rmSync(chunkDir, { recursive: true, force: true });
    }
  }
}
