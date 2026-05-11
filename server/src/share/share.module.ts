import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Share, ShareSchema } from '../schemas/share.schema';
import { File, FileSchema } from '../schemas/file.schema';
import { ShareService } from './share.service';
import { ShareController, SharePublicController } from './share.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Share.name, schema: ShareSchema },
      { name: File.name, schema: FileSchema },
    ]),
  ],
  providers: [ShareService],
  controllers: [ShareController, SharePublicController],
})
export class ShareModule {}
