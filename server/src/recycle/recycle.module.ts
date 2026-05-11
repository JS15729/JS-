import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from '../schemas/file.schema';
import { Folder, FolderSchema } from '../schemas/folder.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { RecycleService } from './recycle.service';
import { RecycleController } from './recycle.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [RecycleService],
  controllers: [RecycleController],
})
export class RecycleModule {}
