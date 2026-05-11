import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Folder, FolderDocument } from '../schemas/folder.schema';
import { File, FileDocument } from '../schemas/file.schema';

@Injectable()
export class FolderService {
  constructor(
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
  ) {}

  async getTree(userId: string, parentId: string | null = null) {
    const filter: any = {
      owner_id: new Types.ObjectId(userId),
      is_deleted: false,
    };
    if (parentId) {
      filter.parent_id = new Types.ObjectId(parentId);
    } else {
      filter.parent_id = null;
    }

    const folders = await this.folderModel.find(filter).sort({ is_pinned: -1, name: 1 });

    // 递归获取子文件夹
    const result = await Promise.all(
      folders.map(async (folder) => {
        const children = await this.getTree(userId, folder._id.toString());
        return {
          id: folder._id,
          name: folder.name,
          parent_id: folder.parent_id,
          is_encrypted: folder.is_encrypted,
          is_pinned: folder.is_pinned,
          created_at: (folder as any).createdAt,
          children: children.length > 0 ? children : [],
        };
      }),
    );

    return result;
  }

  async create(userId: string, dto: { name: string; parent_id?: string }) {
    const parentId = dto.parent_id ? new Types.ObjectId(dto.parent_id) : null;

    // 检查同名文件夹
    const existing = await this.folderModel.findOne({
      name: dto.name,
      parent_id: parentId,
      owner_id: new Types.ObjectId(userId),
      is_deleted: false,
    });
    if (existing) {
      throw new NotFoundException('该目录下已存在同名文件夹');
    }

    // 构建路径
    let path = '/' + dto.name;
    if (parentId) {
      const parent = await this.folderModel.findById(parentId);
      if (parent) {
        path = parent.path + '/' + dto.name;
      }
    }

    const folder = new this.folderModel({
      name: dto.name,
      parent_id: parentId,
      owner_id: new Types.ObjectId(userId),
      path,
    });
    await folder.save();
    return folder;
  }

  async update(id: string, userId: string, dto: { name?: string; parent_id?: string }) {
    const folder = await this.folderModel.findOne({
      _id: id,
      owner_id: new Types.ObjectId(userId),
    });
    if (!folder) throw new NotFoundException('文件夹不存在');

    if (dto.name) {
      folder.name = dto.name;
      // 更新路径
      const pathParts = folder.path.split('/');
      pathParts[pathParts.length - 1] = dto.name;
      folder.path = pathParts.join('/');

      // 递归更新子文件夹的路径
      await this.updateChildrenPaths(folder._id.toString(), folder.path);
    }

    if (dto.parent_id !== undefined) {
      folder.parent_id = dto.parent_id ? new Types.ObjectId(dto.parent_id) : null;
      if (dto.parent_id) {
        const parent = await this.folderModel.findById(dto.parent_id);
        if (parent) {
          folder.path = parent.path + '/' + folder.name;
          await this.updateChildrenPaths(folder._id.toString(), folder.path);
        }
      }
    }

    await folder.save();
    return folder;
  }

  private async updateChildrenPaths(parentId: string, parentPath: string) {
    const children = await this.folderModel.find({ parent_id: new Types.ObjectId(parentId) });
    for (const child of children) {
      child.path = parentPath + '/' + child.name;
      await child.save();
      await this.updateChildrenPaths(child._id.toString(), child.path);
    }
  }

  async remove(id: string, userId: string) {
    const folder = await this.folderModel.findOne({
      _id: id,
      owner_id: new Types.ObjectId(userId),
    });
    if (!folder) throw new NotFoundException('文件夹不存在');

    // 软删除文件夹
    folder.is_deleted = true;
    folder.deleted_at = new Date();
    await folder.save();

    // 软删除子文件夹
    const childFolders = await this.folderModel.find({ parent_id: new Types.ObjectId(id) });
    for (const child of childFolders) {
      await this.remove(child._id.toString(), userId);
    }

    // 软删除文件夹内的文件
    await this.fileModel.updateMany(
      { folder_id: new Types.ObjectId(id) },
      { is_deleted: true, deleted_at: new Date() },
    );

    return { message: '已移入回收站' };
  }

  async togglePin(id: string, userId: string) {
    const folder = await this.folderModel.findOne({
      _id: id,
      owner_id: new Types.ObjectId(userId),
    });
    if (!folder) throw new NotFoundException('文件夹不存在');
    folder.is_pinned = !folder.is_pinned;
    await folder.save();
    return folder;
  }

  async setEncryptPassword(id: string, userId: string, password: string) {
    const folder = await this.folderModel.findOne({
      _id: id,
      owner_id: new Types.ObjectId(userId),
    });
    if (!folder) throw new NotFoundException('文件夹不存在');
    folder.is_encrypted = !!password;
    folder.encrypt_password = password;
    await folder.save();
    return { message: password ? '加密密码已设置' : '加密已取消' };
  }
}
