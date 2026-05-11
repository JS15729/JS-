import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tag, TagSchema } from '../schemas/tag.schema';
import { File, FileSchema } from '../schemas/file.schema';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tag.name, schema: TagSchema },
      { name: File.name, schema: FileSchema },
    ]),
  ],
  providers: [TagService],
  controllers: [TagController],
})
export class TagModule {}
