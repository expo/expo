import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';

export default {
  get name(): string {
    return 'ExpoUpdates';
  },
  async reload(): Promise<void> {
    if (!canUseDOM) return;
    window.location.reload(true);
  },
};
