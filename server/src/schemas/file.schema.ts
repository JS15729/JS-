import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FileDocument = File & Document;

@Schema({ timestamps: true, collection: 'files' })
export class File {
  @Prop({ required: true, maxlength: 200 })
  name: string;

  @Prop({ required: true })
  original_name: string;

  @Prop({ required: true })
  size: number; // bytes

  @Prop({ required: true })
  mime_type: string;

  @Prop({ default: '' })
  hash: string; // MD5 hash for dedup

  @Prop({ type: Types.ObjectId, ref: 'Folder', default: null })
  folder_id: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner_id: Types.ObjectId;

  @Prop({ required: true })
  storage_path: string; // actual path on disk

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ type: Date, default: null })
  deleted_at: Date | null;

  @Prop({ default: false })
  is_pinned: boolean;

  @Prop({ default: 0 })
  view_count: number;

  @Prop({ default: 0 })
  download_count: number;

  @Prop({ default: '' })
  thumbnail_path: string;
}

export const FileSchema = SchemaFactory.createForClass(File);

// ✅ 现有索引（保留）
FileSchema.index({ owner_id: 1, folder_id: 1 });
FileSchema.index({ hash: 1 });
FileSchema.index({ name: 'text', tags: 'text' });

// ✅ 新增索引（性能优化）
FileSchema.index({ owner_id: 1, is_deleted: 1, createdAt: -1 });  // 分页查询优化
FileSchema.index({ folder_id: 1, name: 1 }, { sparse: true });   // 文件夹内文件列表
FileSchema.index({ owner_id: 1, is_pinned: 1, createdAt: -1 });  // 置顶文件查询优化
FileSchema.index({ size: 1 });                                     // 文件大小筛选
FileSchema.index({ mime_type: 1 });                                // 文件类型筛选
FileSchema.index({ createdAt: -1 });                               // 时间排序优化
FileSchema.index({ owner_id: 1, is_deleted: 1, deleted_at: -1 }); // 回收站查询优化
