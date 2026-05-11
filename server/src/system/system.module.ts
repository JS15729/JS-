import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemConfig, SystemConfigSchema } from '../schemas/system-config.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { File, FileSchema } from '../schemas/file.schema';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemConfig.name, schema: SystemConfigSchema },
      { name: User.name, schema: UserSchema },
      { name: File.name, schema: FileSchema },
    ]),
  ],
  providers: [SystemService],
  controllers: [SystemController],
})
export class SystemModule {}
