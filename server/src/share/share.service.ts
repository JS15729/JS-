import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { Share, ShareDocument } from '../schemas/share.schema';
import { File, FileDocument } from '../schemas/file.schema';

@Injectable()
export class ShareService {
  constructor(
    @InjectModel(Share.name) private shareModel: Model<ShareDocument>,
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
  ) {}

  async create(userId: string, dto: {
    file_id: string;
    password?: string;
    type?: string;
    expires_at?: string;
  }) {
    const file = await this.fileModel.findOne({
      _id: dto.file_id,
      owner_id: new Types.ObjectId(userId),
      is_deleted: false,
    });
    if (!file) throw new NotFoundException('文件不存在');

    // 生成唯一分享码
    const code = crypto.randomBytes(8).toString('hex');

    const share = new this.shareModel({
      file_id: new Types.ObjectId(dto.file_id),
      code,
      password: dto.password || '',
      type: dto.type || 'permanent',
      expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
      created_by: new Types.ObjectId(userId),
    });
    await share.save();

    return {
      id: share._id,
      code: share.code,
      password: share.password,
      link: `/s/${share.code}`,
      file_name: file.name,
      type: share.type,
      expires_at: share.expires_at,
    };
  }

  async findByUser(userId: string) {
    const shares = await this.shareModel
      .find({ created_by: new Types.ObjectId(userId) })
      .populate('file_id', 'name original_name size mime_type')
      .sort({ createdAt: -1 });

    return shares.map(s => ({
      id: s._id,
      code: s.code,
      has_password: !!s.password,
      type: s.type,
      expires_at: s.expires_at,
      view_count: s.view_count,
      download_count: s.download_count,
      file: s.file_id,
      created_at: (s as any).createdAt,
    }));
  }

  async remove(id: string, userId: string) {
    const share = await this.shareModel.findOneAndDelete({
      _id: id,
      created_by: new Types.ObjectId(userId),
    });
    if (!share) throw new NotFoundException('分享不存在');
    return { message: '分享已取消' };
  }

  async getByCode(code: string) {
    const share = await this.shareModel.findOne({ code }).populate('file_id');
    if (!share) throw new NotFoundException('分享链接不存在或已失效');

    // 检查是否过期
    if (share.expires_at && new Date() > share.expires_at) {
      throw new NotFoundException('分享链接已过期');
    }

    return {
      id: share._id,
      code: share.code,
      has_password: !!share.password,
      type: share.type,
      file: {
        id: (share.file_id as any)._id,
        name: (share.file_id as any).name,
        original_name: (share.file_id as any).original_name,
        size: (share.file_id as any).size,
        mime_type: (share.file_id as any).mime_type,
      },
    };
  }

  async verifyCode(code: string, password: string) {
    const share = await this.shareModel.findOne({ code });
    if (!share) throw new NotFoundException('分享链接不存在');

    if (share.password && share.password !== password) {
      throw new NotFoundException('提取码错误');
    }

    // 更新访问次数
    share.view_count = (share.view_count || 0) + 1;
    await share.save();

    return this.getByCode(code);
  }

  async downloadByCode(code: string, password?: string) {
    const share = await this.shareModel.findOne({ code }).populate('file_id');
    if (!share) throw new NotFoundException('分享链接不存在');

    if (share.password && share.password !== password) {
      throw new NotFoundException('提取码错误');
    }

    share.download_count = (share.download_count || 0) + 1;
    await share.save();

    const file = share.file_id as any;
    return {
      file: {
        id: file._id,
        name: file.name,
        original_name: file.original_name,
        size: file.size,
        mime_type: file.mime_type,
        storage_path: file.storage_path,
      },
    };
  }
}
