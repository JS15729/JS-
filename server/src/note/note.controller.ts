import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { NoteService } from './note.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Get(':fileId')
  async findByFile(@Param('fileId') fileId: string, @CurrentUser('id') userId: string) {
    return this.noteService.findByFile(fileId, userId);
  }

  @Post(':fileId')
  async save(@Param('fileId') fileId: string, @CurrentUser('id') userId: string, @Body() body: { content: string }) {
    return this.noteService.save(fileId, userId, body.content);
  }

  @Delete(':fileId')
  async remove(@Param('fileId') fileId: string, @CurrentUser('id') userId: string) {
    return this.noteService.remove(fileId, userId);
  }
}
