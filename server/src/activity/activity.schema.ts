import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ActivityDocument = Activity & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Activity {
  @Prop({ required: true, index: true })
  user_id: string;

  @Prop({ required: true, enum: ['upload', 'download', 'share', 'delete', 'restore', 'rename', 'move', 'create_folder', 'login', 'register'] })
  action: string;

  @Prop()
  file_id?: string;

  @Prop()
  file_name?: string;

  @Prop()
  file_size?: number;

  @Prop()
  detail?: string;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Index for user query with time sorting
ActivitySchema.index({ user_id: 1, created_at: -1 });
// Index for global activity feed
ActivitySchema.index({ created_at: -1 });
