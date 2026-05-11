import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ShareDocument = Share & Document;

@Schema({ timestamps: true, collection: 'shares' })
export class Share {
  @Prop({ type: Types.ObjectId, ref: 'File', required: true })
  file_id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  code: string; // 分享码

  @Prop({ default: '' })
  password: string; // 提取码

  @Prop({ default: 'permanent', enum: ['permanent', 'temporary'] })
  type: string;

  @Prop({ type: Date, default: null })
  expires_at: Date | null;

  @Prop({ default: 0 })
  view_count: number;

  @Prop({ default: 0 })
  download_count: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  created_by: Types.ObjectId;
}

export const ShareSchema = SchemaFactory.createForClass(Share);
ShareSchema.index({ code: 1 });
ShareSchema.index({ created_by: 1 });
