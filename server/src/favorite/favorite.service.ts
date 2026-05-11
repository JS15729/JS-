import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from '../schemas/favorite.schema';
import { File, FileDocument } from '../schemas/file.schema';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
  ) {}

  async findAll(userId: string) {
    const favorites = await this.favoriteModel
      .find({ user_id: new Types.ObjectId(userId) })
      .populate('file_id')
      .sort({ createdAt: -1 });

    return favorites.map(f => f.file_id).filter(Boolean);
  }

  async add(userId: string, fileId: string) {
    const file = await this.fileModel.findById(fileId);
    if (!file) throw new NotFoundException('文件不存在');

    const existing = await this.favoriteModel.findOne({
      user_id: new Types.ObjectId(userId),
      file_id: new Types.ObjectId(fileId),
    });
    if (existing) return existing;

    const favorite = new this.favoriteModel({
      user_id: new Types.ObjectId(userId),
      file_id: new Types.ObjectId(fileId),
    });
    await favorite.save();
    return favorite;
  }

  async remove(userId: string, fileId: string) {
    await this.favoriteModel.deleteOne({
      user_id: new Types.ObjectId(userId),
      file_id: new Types.ObjectId(fileId),
    });
    return { message: '已取消收藏' };
  }
}
