import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { File, FileDocument } from '../schemas/file.schema';
import { Folder, FolderDocument } from '../schemas/folder.schema';
import { Note, NoteDocument } from '../schemas/note.schema';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
  ) {}

  async search(userId: string, keyword: string, type: string = 'all', page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const baseFilter = { owner_id: new Types.ObjectId(userId), is_deleted: false };
    const results: any = { files: [], folders: [], total: 0 };

    if (type === 'all' || type === 'file') {
      const [files, fileTotal] = await Promise.all([
        this.fileModel
          .find({
            ...baseFilter,
            $or: [
              { name: { $regex: keyword, $options: 'i' } },
              { original_name: { $regex: keyword, $options: 'i' } },
              { tags: { $regex: keyword, $options: 'i' } },
            ],
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        this.fileModel.countDocuments({
          ...baseFilter,
          $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { tags: { $regex: keyword, $options: 'i' } },
          ],
        }),
      ]);
      results.files = files;
      results.total += fileTotal;
    }

    if (type === 'all' || type === 'folder') {
      const folders = await this.folderModel
        .find({
          ...baseFilter,
          name: { $regex: keyword, $options: 'i' },
        })
        .sort({ name: 1 });
      results.folders = folders;
      if (type === 'folder') {
        results.total = await this.folderModel.countDocuments({
          ...baseFilter,
          name: { $regex: keyword, $options: 'i' },
        });
      }
    }

    // 同时搜索笔记内容
    if (type === 'all' || type === 'file') {
      const noteResults = await this.noteModel
        .find({
          user_id: new Types.ObjectId(userId),
          content: { $regex: keyword, $options: 'i' },
        })
        .populate('file_id')
        .limit(10);

      // 将笔记搜索到的文件去重添加到结果中
      const noteFileIds = results.files.map((f: any) => f._id.toString());
      for (const note of noteResults) {
        const file = note.file_id as any;
        if (file && !noteFileIds.includes(file._id.toString())) {
          results.files.push(file);
        }
      }
    }

    return { ...results, keyword, page, limit };
  }
}
