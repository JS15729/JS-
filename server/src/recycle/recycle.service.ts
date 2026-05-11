import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import { File, FileDocument } from '../schemas/file.schema';
import { Folder, FolderDocument } from '../schemas/folder.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class RecycleService {
  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(userId: string) {
    const [files, folders] = await Promise.all([
      this.fileModel.find({
        owner_id: new Types.ObjectId(userId),
        is_deleted: true,
      }).sort({ deleted_at: -1 }),
      this.folderModel.find({
        owner_id: new Types.ObjectId(userId),
        is_deleted: true,
      }).sort({ deleted_at: -1 }),
    ]);

    return { files, folders };
  }

  async restoreFile(fileId: string, userId: string) {
    const file = await this.fileModel.findOne({
      _id: fileId,
      owner_id: new Types.ObjectId(userId),
      is_deleted: true,
    });
    if (!file) throw new NotFoundException('文件不存在');

    // 检查文件物理是否存在
    if (!fs.existsSync(file.storage_path)) {
      throw new NotFoundException('文件数据已丢失，无法恢复');
    }

    file.is_deleted = false;
    file.deleted_at = null;
    await file.save();

    await this.userModel.findByIdAndUpdate(userId, { $inc: { storage_used: file.size } });

    return { message: '文件已恢复' };
  }

  async restoreFolder(folderId: string, userId: string) {
    const folder = await this.folderModel.findOne({
      _id: folderId,
      owner_id: new Types.ObjectId(userId),
      is_deleted: true,
    });
    if (!folder) throw new NotFoundException('文件夹不存在');

    folder.is_deleted = false;
    folder.deleted_at = null;
    await folder.save();

    // 恢复文件夹内的文件
    await this.fileModel.updateMany(
      { folder_id: new Types.ObjectId(folderId), owner_id: new Types.ObjectId(userId) },
      { is_deleted: false, deleted_at: null },
    );

    return { message: '文件夹已恢复' };
  }

  async permanentDeleteFile(fileId: string, userId: string) {
    const file = await this.fileModel.findOne({
      _id: fileId,
      owner_id: new Types.ObjectId(userId),
      is_deleted: true,
    });
    if (!file) throw new NotFoundException('文件不存在');

    // 删除物理文件
    if (fs.existsSync(file.storage_path)) {
      fs.unlinkSync(file.storage_path);
    }

    // 减少用户存储空间
    await this.userModel.findByIdAndUpdate(userId, { $inc: { storage_used: -file.size } });

    await this.fileModel.findByIdAndDelete(fileId);
    return { message: '文件已永久删除' };
  }

  async permanentDeleteFolder(folderId: string, userId: string) {
    const folder = await this.folderModel.findOne({
      _id: folderId,
      owner_id: new Types.ObjectId(userId),
      is_deleted: true,
    });

    // 永久删除文件夹内所有文件
    const files = await this.fileModel.find({
      folder_id: new Types.ObjectId(folderId),
      owner_id: new Types.ObjectId(userId),
    });

    for (const file of files) {
      if (fs.existsSync(file.storage_path)) {
        try { fs.unlinkSync(file.storage_path); } catch (e) { /* ignore */ }
      }
      await this.fileModel.findByIdAndDelete(file._id);
    }

    // 递归删除子文件夹
    const childFolders = await this.folderModel.find({
      parent_id: new Types.ObjectId(folderId),
    });
    for (const child of childFolders) {
      await this.permanentDeleteFolder(child._id.toString(), userId);
    }

    await this.folderModel.findByIdAndDelete(folderId);
    return { message: '已永久删除' };
  }

  async emptyRecycle(userId: string) {
    const files = await this.fileModel.find({
      owner_id: new Types.ObjectId(userId),
      is_deleted: true,
    });

    for (const file of files) {
      if (fs.existsSync(file.storage_path)) {
        try { fs.unlinkSync(file.storage_path); } catch (e) { /* ignore */ }
      }
      await this.fileModel.findByIdAndDelete(file._id);
    }

    await this.folderModel.deleteMany({
      owner_id: new Types.ObjectId(userId),
      is_deleted: true,
    });

    return { message: '回收站已清空', deleted_count: files.length };
  }
}
