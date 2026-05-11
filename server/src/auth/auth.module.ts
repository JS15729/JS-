import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { User, UserSchema } from '../schemas/user.schema';
import { join } from 'path';
import * as fs from 'fs';

// 确保头像目录存在
const avatarDir = join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MulterModule.register({ dest: avatarDir }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get('JWT_SECRET');
        // 🔒 安全加固：禁止JWT_SECRET使用默认值
        if (!secret || secret === 'default-secret') {
          throw new Error(
            '🚨 安全错误：JWT_SECRET 必须设置，不能使用默认值！\n' +
            '请在 .env 文件中设置强密码：\n' +
            'JWT_SECRET=your-super-strong-secret-key-min-32-chars\n' +
            '建议：openssl rand -base64 32'
          );
        }
        
        return {
          secret,
          signOptions: {
            expiresIn: config.get('JWT_EXPIRES_IN', '2h'), // 🔒 缩短过期时间：7d → 2h
            issuer: 'private-cloud-storage',
            audience: 'web-client',
          },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
