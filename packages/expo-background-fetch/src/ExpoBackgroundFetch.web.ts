import { BackgroundFetchStatus } from './BackgroundFetch.types';

export default {
  async getStatusAsync(): Promise<BackgroundFetchStatus | null> {
    return BackgroundFetchStatus.Restricted;
  },
};
