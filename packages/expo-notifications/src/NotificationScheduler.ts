import { NativeModulesProxy, ProxyNativeModule } from '@unimodules/core';

import { NotificationRequest } from './NotificationPresenter.types';
import { NativeNotificationTrigger } from './NotificationScheduler.types';
import { Notification } from './NotificationsEmitter.types';

export { NotificationRequest } from './NotificationPresenter.types';

export interface NotificationSchedulerModule extends ProxyNativeModule {
  getAllScheduledNotificationsAsync: () => Promise<Notification[]>;
  scheduleNotificationAsync: (
    identifier: string,
    notificationRequest: NotificationRequest,
    trigger: NativeNotificationTrigger
  ) => Promise<void>;
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
}

export default (NativeModulesProxy.ExpoNotificationScheduler as any) as NotificationSchedulerModule;
