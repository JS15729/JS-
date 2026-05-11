import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from '../schemas/file.schema';
import { PreviewService } from './preview.service';
import { PreviewController } from './preview.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
  ],
  providers: [PreviewService],
  controllers: [PreviewController],
})
export class PreviewModule {}
