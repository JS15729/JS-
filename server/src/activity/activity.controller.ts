import { Controller, Get, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async getMyActivities(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    const activities = await this.activityService.getUserActivities(
      userId,
      limit || 50,
    );
    return { activities };
  }
}
