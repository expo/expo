import { ProxyNativeModule } from '@unimodules/core';
import { NotificationRequest } from './NotificationPresenter.types';
import { NativeNotificationTrigger } from './NotificationScheduler.types';
import { Notification } from './NotificationsEmitter.types';
export { NotificationRequest } from './NotificationPresenter.types';
export interface NotificationSchedulerModule extends ProxyNativeModule {
    getAllScheduledNotificationsAsync: () => Promise<Notification[]>;
    scheduleNotificationAsync: (identifier: string, notificationRequest: NotificationRequest, trigger: NativeNotificationTrigger) => Promise<string>;
    cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
    cancelAllScheduledNotificationsAsync: () => Promise<void>;
}
declare const _default: NotificationSchedulerModule;
export default _default;
