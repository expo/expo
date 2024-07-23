import { ProxyNativeModule } from 'expo/internal';

export interface BackgroundNotificationTasksModule extends ProxyNativeModule {
  registerTaskAsync: (taskName: string) => Promise<null>;
  unregisterTaskAsync: (taskName: string) => Promise<null>;
}

export enum BackgroundNotificationResult {
  NoData = 1,
  NewData = 2,
  Failed = 3,
}
