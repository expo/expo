import { BackgroundTaskStatus } from './BackgroundTask.types';

export default {
  async getStatusAsync(): Promise<BackgroundTaskStatus> {
    return BackgroundTaskStatus.Restricted;
  },
};
