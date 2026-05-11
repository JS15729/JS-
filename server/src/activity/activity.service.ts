import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from './activity.schema';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
  ) {}

  async log(data: {
    user_id: string;
    action: string;
    file_id?: string;
    file_name?: string;
    file_size?: number;
    detail?: string;
  }) {
    return this.activityModel.create(data);
  }

  async getUserActivities(userId: string, limit = 50) {
    return this.activityModel
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .exec();
  }

  async getGlobalActivities(limit = 100) {
    return this.activityModel
      .find()
      .sort({ created_at: -1 })
      .limit(limit)
      .exec();
  }
}
