import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { File, FileDocument } from '../schemas/file.schema';
import { Favorite, FavoriteDocument } from '../schemas/favorite.schema';
import { Note, NoteDocument } from '../schemas/note.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { ConfigService } from '../config/config.service';

@Injectable()
export class FileService {
  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async findByFolder(userId: string, folderId: string | null, page = 1, limit = 50) {
    const filter: any = {
      owner_id: new Types.ObjectId(userId),
      is_deleted: false,
    };
    if (folderId) {
      filter.folder_id = new Types.ObjectId(folderId);
    } else {
      filter.folder_id = null;
    }

    const skip = (page - 1) * limit;
    const [files, total] = await Promise.all([
      this.fileModel
        .find(filter)
        .sort({ is_pinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.fileModel.countDocuments(filter),
    ]);
    return { list: files, total, page, limit };
  }

  async findById(id: string, userId?: string) {
    const file = await this.fileModel.findById(id);
    if (!file || file.is_deleted) throw new NotFoundException('文件不存在');

    // 增加浏览次数
    file.view_count = (file.view_count || 0) + 1;
    await file.save();

    return file;
  }

  async create(userId: string, dto: {
    name: string;
    original_name: string;
    size: number;
    mime_type: string;
    hash: string;
    folder_id?: string;
    storage_path: string;
    tags?: string[];
  }) {
    // 检查存储配额
    const user = await this.userModel.findById(userId);
    if (user.storage_used + dto.size > user.storage_quota) {
      throw new BadRequestException('存储空间不足，请清理或联系管理员扩容');
    }

    // 哈希去重检查
    if (dto.hash) {
      const existing = await this.fileModel.findOne({
        hash: dto.hash,
        owner_id: new Types.ObjectId(userId),
        is_deleted: false,
      });
      if (existing) {
        // 返回已存在的文件引用，不重复存储
        await this.userModel.findByIdAndUpdate(userId, { $inc: { storage_used: dto.size } });
        return {
          ...existing.toObject(),
          deduplicated: true,
          message: '文件已存在，已自动去重引用',
        };
      }
    }

    const file = new this.fileModel({
      name: dto.name || dto.original_name,
      original_name: dto.original_name,
      size: dto.size,
      mime_type: dto.mime_type,
      hash: dto.hash,
      folder_id: dto.folder_id ? new Types.ObjectId(dto.folder_id) : null,
      owner_id: new Types.ObjectId(userId),
      storage_path: dto.storage_path,
      tags: dto.tags || [],
    });
    await file.save();

    // 更新用户已用存储空间
    await this.userModel.findByIdAndUpdate(userId, { $inc: { storage_used: dto.size } });

    return file;
  }

  async update(id: string, userId: string, dto: {
    name?: string;
    folder_id?: string;
    tags?: string[];
    is_pinned?: boolean;
  }) {
    const file = await this.fileModel.findOne({
      _id: id,
      owner_id: new Types.ObjectId(userId),
      is_deleted: false,
    });
    if (!file) throw new NotFoundException('文件不存在');

    if (dto.name !== undefined) file.name = dto.name;
    if (dto.folder_id !== undefined) file.folder_id = dto.folder_id ? new Types.ObjectId(dto.folder_id) : null;
    if (dto.tags !== undefined) file.tags = dto.tags;
    if (dto.is_pinned !== undefined) file.is_pinned = dto.is_pinned;

    await file.save();
    return file;
  }

  async remove(id: string, userId: string) {
    const file = await this.fileModel.findOne({
      _id: id,
      owner_id: new Types.ObjectId(userId),
      is_deleted: false,
    });
    if (!file) throw new NotFoundException('文件不存在');

    file.is_deleted = true;
    file.deleted_at = new Date();
    await file.save();
    return { message: '已移入回收站' };
  }

  async download(id: string) {
    const file = await this.fileModel.findById(id);
    if (!file || file.is_deleted) throw new NotFoundException('文件不存在');

    // 检查物理文件是否存在
    const filePath = path.resolve(file.storage_path);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('文件数据丢失，请联系管理员');
    }

    file.download_count = (file.download_count || 0) + 1;
    await file.save();

    return { file, filePath };
  }

  async checkDedup(hash: string, userId: string) {
    if (!hash) return { exists: false };

    const existing = await this.fileModel.findOne({
      hash,
      owner_id: new Types.ObjectId(userId),
      is_deleted: false,
    });

    return {
      exists: !!existing,
      file: existing ? {
        id: existing._id,
        name: existing.name,
        size: existing.size,
      } : null,
    };
  }

  async getPinned(userId: string) {
    return this.fileModel.find({
      owner_id: new Types.ObjectId(userId),
      is_deleted: false,
      is_pinned: true,
    }).sort({ createdAt: -1 });
  }

  async getFilesForBatch(ids: string[], userId: string) {
    const files = await this.fileModel.find({
      _id: { $in: ids.map(id => new Types.ObjectId(id)) },
      owner_id: new Types.ObjectId(userId),
      is_deleted: false,
    });
    if (files.length === 0) throw new NotFoundException('未找到有效的文件');
    return files;
  }

  async batchDelete(ids: string[], userId: string) {
    const result = await this.fileModel.updateMany(
      {
        _id: { $in: ids.map(id => new Types.ObjectId(id)) },
        owner_id: new Types.ObjectId(userId),
        is_deleted: false,
      },
      { is_deleted: true, deleted_at: new Date() },
    );
    return { message: `已删除 ${result.modifiedCount} 个文件` };
  }

  async getNote(fileId: string, userId: string) {
    return this.noteModel.findOne({
      file_id: new Types.ObjectId(fileId),
      user_id: new Types.ObjectId(userId),
    });
  }

  async saveNote(fileId: string, userId: string, content: string) {
    let note = await this.noteModel.findOne({
      file_id: new Types.ObjectId(fileId),
      user_id: new Types.ObjectId(userId),
    });

    if (note) {
      note.content = content;
      await note.save();
    } else {
      note = new this.noteModel({
        file_id: new Types.ObjectId(fileId),
        user_id: new Types.ObjectId(userId),
        content,
      });
      await note.save();
    }
    return note;
  }
}
