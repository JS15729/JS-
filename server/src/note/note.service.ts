import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Note, NoteDocument } from '../schemas/note.schema';

@Injectable()
export class NoteService {
  constructor(@InjectModel(Note.name) private noteModel: Model<NoteDocument>) {}

  async findByFile(fileId: string, userId: string) {
    return this.noteModel.findOne({
      file_id: new Types.ObjectId(fileId),
      user_id: new Types.ObjectId(userId),
    });
  }

  async save(fileId: string, userId: string, content: string) {
    let note = await this.noteModel.findOne({
      file_id: new Types.ObjectId(fileId),
      user_id: new Types.ObjectId(userId),
    });

    if (note) {
      note.content = content;
    } else {
      note = new this.noteModel({
        file_id: new Types.ObjectId(fileId),
        user_id: new Types.ObjectId(userId),
        content,
      });
    }
    await note.save();
    return note;
  }

  async remove(fileId: string, userId: string) {
    await this.noteModel.deleteOne({
      file_id: new Types.ObjectId(fileId),
      user_id: new Types.ObjectId(userId),
    });
    return { message: '备注已删除' };
  }
}
