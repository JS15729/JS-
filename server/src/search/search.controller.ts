import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @CurrentUser('id') userId: string,
    @Query('q') keyword: string,
    @Query('type') type: string = 'all',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    if (!keyword || keyword.trim().length === 0) {
      return { files: [], folders: [], total: 0, keyword: '' };
    }
    return this.searchService.search(userId, keyword.trim(), type, +page, +limit);
  }
}
