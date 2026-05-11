import { Module, Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { FolderModule } from './folder/folder.module';
import { FileModule } from './file/file.module';
import { UploadModule } from './upload/upload.module';
import { PreviewModule } from './preview/preview.module';
import { ShareModule } from './share/share.module';
import { SearchModule } from './search/search.module';
import { TagModule } from './tag/tag.module';
import { FavoriteModule } from './favorite/favorite.module';
import { RecycleModule } from './recycle/recycle.module';
import { BackupModule } from './backup/backup.module';
import { SystemModule } from './system/system.module';
import { NoteModule } from './note/note.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { HealthModule } from './health/health.module';
import { ActivityModule } from './activity/activity.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI'),
      }),
    }),
    ScheduleModule.forRoot(),
    
    // 🔒 速率限制模块 - 防止DDoS攻击
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.getNumber('THROTTLE_TTL', 60),      // 60秒窗口
            limit: config.getNumber('THROTTLE_LIMIT', 100),  // 最多100次请求
          },
        ],
        // 自定义错误信息
        errorMessage: '请求过于频繁，请稍后再试',
      }),
    }),
    
    AuthModule,
    UserModule,
    FolderModule,
    FileModule,
    UploadModule,
    PreviewModule,
    ShareModule,
    SearchModule,
    TagModule,
    FavoriteModule,
    RecycleModule,
    BackupModule,
    SystemModule,
    NoteModule,
    AnnouncementModule,
    HealthModule,
    ActivityModule,
  ],
  // 🔒 全局速率限制Guard
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ] as Provider[],
})
export class AppModule {}
