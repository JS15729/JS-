import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemConfigDocument = SystemConfig & Document;

@Schema({ timestamps: true, collection: 'system_configs' })
export class SystemConfig {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  value: string;

  @Prop({ default: '' })
  description: string;
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
