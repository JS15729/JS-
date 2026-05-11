import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: { username: string; email: string; password: string; inviteCode?: string }) {
    const { username, email, password } = registerDto;

    // 检查用户名是否存在
    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      throw new ConflictException('用户名或邮箱已被注册');
    }

    // 检查是否已有管理员，第一个注册用户自动成为管理员
    const userCount = await this.userModel.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new this.userModel({
      username,
      email,
      password: hashedPassword,
      role,
    });
    await user.save();

    const token = this.generateToken(user);

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        storage_used: user.storage_used,
        storage_quota: user.storage_quota,
      },
      token,
    };
  }

  async login(loginDto: { username: string; password: string }) {
    const { username, password } = loginDto;

    // 支持用户名或邮箱登录
    const user = await this.userModel.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status === 'banned') {
      throw new UnauthorizedException('账号已被封禁，请联系管理员');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 更新登录信息
    user.login_count = (user.login_count || 0) + 1;
    user.last_login = new Date();
    await user.save();

    const token = this.generateToken(user);

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        storage_used: user.storage_used,
        storage_quota: user.storage_quota,
        login_count: user.login_count,
        last_login: user.last_login,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return user;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId);
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('原密码错误');
    }
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    return { message: '密码修改成功' };
  }

  async updateProfile(userId: string, data: { username?: string; email?: string }) {
    const { username, email } = data;

    // 检查重名
    if (username || email) {
      const query: any = { _id: { $ne: userId } };
      const orConditions: any[] = [];
      if (username) orConditions.push({ username });
      if (email) orConditions.push({ email });
      if (orConditions.length) query.$or = orConditions;

      const existing = await this.userModel.findOne(query);
      if (existing) {
        throw new ConflictException('用户名或邮箱已被占用');
      }
    }

    const updates: any = {};
    if (username) updates.username = username;
    if (email) updates.email = email;

    const user = await this.userModel.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select('-password');
    if (!user) throw new UnauthorizedException('用户不存在');

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      storage_used: user.storage_used,
      storage_quota: user.storage_quota,
      login_count: user.login_count,
      last_login: user.last_login,
    };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传头像文件');
    }
    // 将相对路径转为 URL
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { avatar: avatarUrl } },
      { new: true },
    ).select('-password');

    if (!user) throw new UnauthorizedException('用户不存在');

    return {
      avatar: avatarUrl,
      message: '头像更新成功',
    };
  }

  private generateToken(user: UserDocument): string {
    const payload = {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
