import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnnouncementDocument = Announcement & Document;

@Schema({ timestamps: true, collection: 'announcements' })
export class Announcement {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 'info', enum: ['info', 'warning', 'important', 'success'] })
  level: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author_id: Types.ObjectId;

  @Prop({ default: false })
  is_pinned: boolean;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: [] })
  read_by: Types.ObjectId[];
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
AnnouncementSchema.index({ is_active: 1, createdAt: -1 });
