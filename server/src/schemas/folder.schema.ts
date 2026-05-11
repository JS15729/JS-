import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FolderDocument = Folder & Document;

@Schema({ timestamps: true, collection: 'folders' })
export class Folder {
  @Prop({ required: true, maxlength: 100 })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Folder', default: null })
  parent_id: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner_id: Types.ObjectId;

  @Prop({ default: '/' })
  path: string;

  @Prop({ default: false })
  is_encrypted: boolean;

  @Prop({ default: '' })
  encrypt_password: string;

  @Prop({ default: false })
  is_pinned: boolean;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ type: Date, default: null })
  deleted_at: Date | null;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);

// ✅ 现有索引（保留）
FolderSchema.index({ owner_id: 1, parent_id: 1 });  // 查询子文件夹
FolderSchema.index({ name: 'text' });                // 全文搜索

// ✅ 新增索引（性能优化）
FolderSchema.index({ owner_id: 1, is_deleted: 1 });          // 回收站查询优化
FolderSchema.index({ parent_id: 1, name: 1 }, { sparse: true });  // 防止同级重名
FolderSchema.index({ owner_id: 1, is_pinned: 1, createdAt: -1 });  // 置顶文件夹查询
FolderSchema.index({ path: 1 });                                // 路径查询优化
FolderSchema.index({ createdAt: -1 });                          // 时间排序优化
