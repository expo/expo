import { ProxyNativeModule } from '@unimodules/core';

export interface BackgroundNotificationsModule extends ProxyNativeModule {
  registerTaskAsync: (taskName: string) => Promise<null>;
  unregisterTaskAsync: (taskName: string) => Promise<null>;
}
