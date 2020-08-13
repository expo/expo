import { BackgroundFetchStatus } from './BackgroundFetch.types';

export default {
  get name(): string {
    return 'ExpoBackgroundFetch';
  },
  async getStatusAsync(): Promise<BackgroundFetchStatus | null> {
    return BackgroundFetchStatus.Restricted;
  },
};
