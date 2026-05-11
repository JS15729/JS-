import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tag, TagDocument } from '../schemas/tag.schema';
import { File, FileDocument } from '../schemas/file.schema';

@Injectable()
export class TagService {
  constructor(
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
  ) {}

  async findAll(userId: string) {
    return this.tagModel.find({ owner_id: new Types.ObjectId(userId) }).sort({ name: 1 });
  }

  async create(userId: string, dto: { name: string; color?: string }) {
    const existing = await this.tagModel.findOne({
      name: dto.name,
      owner_id: new Types.ObjectId(userId),
    });
    if (existing) throw new ConflictException('标签名已存在');

    const tag = new this.tagModel({
      name: dto.name,
      color: dto.color || '#409EFF',
      owner_id: new Types.ObjectId(userId),
    });
    await tag.save();
    return tag;
  }

  async update(id: string, userId: string, dto: { name?: string; color?: string }) {
    const tag = await this.tagModel.findOne({
      _id: id,
      owner_id: new Types.ObjectId(userId),
    });
    if (!tag) throw new NotFoundException('标签不存在');

    if (dto.name) tag.name = dto.name;
    if (dto.color) tag.color = dto.color;
    await tag.save();
    return tag;
  }

  async remove(id: string, userId: string) {
    const tag = await this.tagModel.findOneAndDelete({
      _id: id,
      owner_id: new Types.ObjectId(userId),
    });
    if (!tag) throw new NotFoundException('标签不存在');

    // 从所有文件中移除该标签
    await this.fileModel.updateMany(
      { owner_id: new Types.ObjectId(userId) },
      { $pull: { tags: tag.name } },
    );

    return { message: '标签已删除' };
  }
}
