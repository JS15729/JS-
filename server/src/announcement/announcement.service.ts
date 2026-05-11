import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Announcement, AnnouncementDocument } from '../schemas/announcement.schema';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectModel(Announcement.name) private announcementModel: Model<AnnouncementDocument>,
  ) {}

  async findAll(userId: string) {
    const announcements = await this.announcementModel
      .find({ is_active: true })
      .populate('author_id', 'username')
      .sort({ is_pinned: -1, createdAt: -1 });

    return announcements.map((a: any) => ({
      _id: a._id,
      title: a.title,
      content: a.content,
      level: a.level,
      is_pinned: a.is_pinned,
      author: a.author_id?.username || '系统',
      is_read: a.read_by?.some((id: any) => id.toString() === userId),
      created_at: a.createdAt,
    }));
  }

  async getUnreadCount(userId: string) {
    const count = await this.announcementModel.countDocuments({
      is_active: true,
      read_by: { $ne: new Types.ObjectId(userId) },
    });
    return { count };
  }

  async create(authorId: string, dto: { title: string; content: string; level?: string; is_pinned?: boolean }) {
    const announcement = new this.announcementModel({
      title: dto.title,
      content: dto.content,
      level: dto.level || 'info',
      is_pinned: dto.is_pinned || false,
      author_id: new Types.ObjectId(authorId),
    });
    await announcement.save();
    return announcement;
  }

  async markAsRead(id: string, userId: string) {
    const announcement = await this.announcementModel.findById(id);
    if (!announcement) throw new NotFoundException('公告不存在');

    const uid = new Types.ObjectId(userId);
    if (!announcement.read_by?.some((rid: any) => rid.toString() === userId)) {
      announcement.read_by = [...(announcement.read_by || []), uid];
      await announcement.save();
    }
    return { message: '已标记为已读' };
  }

  async markAllRead(userId: string) {
    const announcements = await this.announcementModel.find({
      is_active: true,
      read_by: { $ne: new Types.ObjectId(userId) },
    });
    const uid = new Types.ObjectId(userId);
    for (const a of announcements) {
      a.read_by = [...(a.read_by || []), uid];
      await a.save();
    }
    return { message: '全部已读' };
  }

  async update(id: string, dto: { title?: string; content?: string; level?: string; is_pinned?: boolean; is_active?: boolean }) {
    const announcement = await this.announcementModel.findById(id);
    if (!announcement) throw new NotFoundException('公告不存在');

    if (dto.title !== undefined) announcement.title = dto.title;
    if (dto.content !== undefined) announcement.content = dto.content;
    if (dto.level !== undefined) announcement.level = dto.level;
    if (dto.is_pinned !== undefined) announcement.is_pinned = dto.is_pinned;
    if (dto.is_active !== undefined) announcement.is_active = dto.is_active;

    await announcement.save();
    return announcement;
  }

  async remove(id: string) {
    await this.announcementModel.findByIdAndDelete(id);
    return { message: '公告已删除' };
  }
}
