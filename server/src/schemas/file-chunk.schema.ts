import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FileChunkDocument = FileChunk & Document;

@Schema({ timestamps: true, collection: 'file_chunks' })
export class FileChunk {
  @Prop({ required: true })
  file_hash: string; // 完整文件的MD5

  @Prop({ required: true })
  chunk_index: number;

  @Prop({ required: true })
  chunk_path: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  upload_id: string;
}

export const FileChunkSchema = SchemaFactory.createForClass(FileChunk);
FileChunkSchema.index({ upload_id: 1, chunk_index: 1 });
FileChunkSchema.index({ file_hash: 1 });
