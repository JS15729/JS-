import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemConfig, SystemConfigDocument } from '../schemas/system-config.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { File, FileDocument } from '../schemas/file.schema';

@Injectable()
export class SystemService {
  constructor(
    @InjectModel(SystemConfig.name) private configModel: Model<SystemConfigDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
  ) {}

  async getAllConfigs() {
    const configs = await this.configModel.find();
    const result: Record<string, string> = {};
    for (const c of configs) {
      result[c.key] = c.value;
    }
    return result;
  }

  async updateConfig(key: string, value: string, description?: string) {
    let config = await this.configModel.findOne({ key });

    if (config) {
      config.value = value;
      if (description) config.description = description;
    } else {
      config = new this.configModel({ key, value, description: description || '' });
    }
    await config.save();
    return config;
  }

  async getStats() {
    const [userCount, fileCount, totalStorage, bannedCount] = await Promise.all([
      this.userModel.countDocuments(),
      this.fileModel.countDocuments({ is_deleted: false }),
      this.fileModel.aggregate([
        { $match: { is_deleted: false } },
        { $group: { _id: null, total: { $sum: '$size' } } },
      ]),
      this.userModel.countDocuments({ status: 'banned' }),
    ]);

    return {
      user_count: userCount,
      file_count: fileCount,
      total_storage: totalStorage[0]?.total || 0,
      banned_user_count: bannedCount,
    };
  }

  async getStorageBreakdown() {
    const breakdown = await this.fileModel.aggregate([
      { $match: { is_deleted: false } },
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$size' },
          totalFiles: { $sum: 1 },
          imageSize: { $sum: { $cond: [{ $regexMatch: { input: '$mime_type', regex: /^image\// } }, '$size', 0] } },
          imageCount: { $sum: { $cond: [{ $regexMatch: { input: '$mime_type', regex: /^image\// } }, 1, 0] } },
          videoSize: { $sum: { $cond: [{ $regexMatch: { input: '$mime_type', regex: /^video\// } }, '$size', 0] } },
          videoCount: { $sum: { $cond: [{ $regexMatch: { input: '$mime_type', regex: /^video\// } }, 1, 0] } },
          audioSize: { $sum: { $cond: [{ $regexMatch: { input: '$mime_type', regex: /^audio\// } }, '$size', 0] } },
          audioCount: { $sum: { $cond: [{ $regexMatch: { input: '$mime_type', regex: /^audio\// } }, 1, 0] } },
          documentSize: { $sum: { $cond: [{ $regexMatch: { input: '$mime_type', regex: /pdf|word|excel|text|spreadsheet|presentation|document/ } }, '$size', 0] } },
          documentCount: { $sum: { $cond: [{ $regexMatch: { input: '$mime_type', regex: /pdf|word|excel|text|spreadsheet|presentation|document/ } }, 1, 0] } },
          otherSize: { $sum: { $cond: [{ $not: { $regexMatch: { input: '$mime_type', regex: /^(image|video|audio)\/|pdf|word|excel|text|spreadsheet|presentation|document/ } } }, '$size', 0] } },
          otherCount: { $sum: { $cond: [{ $not: { $regexMatch: { input: '$mime_type', regex: /^(image|video|audio)\/|pdf|word|excel|text|spreadsheet|presentation|document/ } } }, 1, 0] } },
        },
      },
    ]);

    const data = breakdown[0] || {};
    return {
      total: { size: data.totalSize || 0, count: data.totalFiles || 0 },
      images: { size: data.imageSize || 0, count: data.imageCount || 0 },
      videos: { size: data.videoSize || 0, count: data.videoCount || 0 },
      audio: { size: data.audioSize || 0, count: data.audioCount || 0 },
      documents: { size: data.documentSize || 0, count: data.documentCount || 0 },
      other: { size: data.otherSize || 0, count: data.otherCount || 0 },
    };
  }
}
