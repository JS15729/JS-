import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TagDocument = Tag & Document;

@Schema({ timestamps: true, collection: 'tags' })
export class Tag {
  @Prop({ required: true, maxlength: 30 })
  name: string;

  @Prop({ default: '#409EFF' })
  color: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner_id: Types.ObjectId;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
TagSchema.index({ owner_id: 1 });
