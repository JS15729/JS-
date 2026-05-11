import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FileChunk, FileChunkSchema } from '../schemas/file-chunk.schema';
import { File, FileSchema } from '../schemas/file.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FileChunk.name, schema: FileChunkSchema },
      { name: File.name, schema: FileSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
