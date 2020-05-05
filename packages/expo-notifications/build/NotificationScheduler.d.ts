import { ProxyNativeModule } from '@unimodules/core';
import { NotificationTriggerInput } from './NotificationScheduler.types';
import { Notification, NotificationContentInput } from './Notifications.types';
export interface NotificationSchedulerModule extends ProxyNativeModule {
    getAllScheduledNotificationsAsync: () => Promise<Notification[]>;
    scheduleNotificationAsync: (identifier: string, notificationContent: NotificationContentInput, trigger: NotificationTriggerInput) => Promise<string>;
    cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
    cancelAllScheduledNotificationsAsync: () => Promise<void>;
}
declare const _default: NotificationSchedulerModule;
export default _default;
