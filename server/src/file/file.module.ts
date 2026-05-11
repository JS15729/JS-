import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from '../schemas/file.schema';
import { Favorite, FavoriteSchema } from '../schemas/favorite.schema';
import { Note, NoteSchema } from '../schemas/note.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { FileService } from './file.service';
import { FileController } from './file.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Note.name, schema: NoteSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [FileService],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
