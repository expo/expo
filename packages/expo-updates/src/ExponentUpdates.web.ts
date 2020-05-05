import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';

export default {
  get name(): string {
    return 'ExponentUpdates';
  },
  async reload(): Promise<void> {
    if (!canUseDOM) return;
    location.reload(true);
  },
  async reloadFromCache(): Promise<void> {
    if (!canUseDOM) return;
    location.reload(true);
  },
};
