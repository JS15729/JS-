import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, minlength: 3, maxlength: 20 })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user', enum: ['user', 'admin', 'super_admin'] })
  role: string;

  @Prop({ default: 'active', enum: ['active', 'banned', 'inactive'] })
  status: string;

  @Prop({ default: 0 })
  storage_used: number; // bytes

  @Prop({ default: 10737418240 }) // 10GB default quota
  storage_quota: number;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: 0 })
  login_count: number;

  @Prop({ type: Date })
  last_login: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// 创建文本索引用于搜索
UserSchema.index({ username: 'text', email: 'text' });
