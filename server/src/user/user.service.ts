import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel
        .find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.userModel.countDocuments(),
    ]);
    return { list: users, total, page, limit };
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async banUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('用户不存在');
    if (user.role === 'admin') throw new BadRequestException('不能封禁管理员');
    user.status = 'banned';
    await user.save();
    return user;
  }

  async unbanUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('用户不存在');
    user.status = 'active';
    await user.save();
    return user;
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('用户不存在');
    if (user.role === 'admin') throw new BadRequestException('不能删除管理员');
    await this.userModel.findByIdAndDelete(id);
    return { message: '用户已删除' };
  }

  async updateQuota(id: string, quota: number) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('用户不存在');
    user.storage_quota = quota;
    await user.save();
    return user;
  }

  async updateStorageUsed(id: string, size: number) {
    await this.userModel.findByIdAndUpdate(id, { $inc: { storage_used: size } });
  }
}
