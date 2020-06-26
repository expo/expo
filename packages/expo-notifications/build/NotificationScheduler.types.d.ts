import { ProxyNativeModule } from '@unimodules/core';
import { NotificationRequest, NotificationContentInput } from './Notifications.types';
export interface NotificationSchedulerModule extends ProxyNativeModule {
    getAllScheduledNotificationsAsync?: () => Promise<NotificationRequest[]>;
    scheduleNotificationAsync?: (identifier: string, notificationContent: NotificationContentInput, trigger: NotificationTriggerInput) => Promise<string>;
    cancelScheduledNotificationAsync?: (identifier: string) => Promise<void>;
    cancelAllScheduledNotificationsAsync?: () => Promise<void>;
}
export interface CalendarTriggerInput {
    type: 'calendar';
    repeats?: boolean;
    value: {
        timezone?: string;
        year?: number;
        month?: number;
        weekday?: number;
        weekOfMonth?: number;
        weekOfYear?: number;
        weekdayOrdinal?: number;
        day?: number;
        hour?: number;
        minute?: number;
        second?: number;
    };
}
export interface TimeIntervalTriggerInput {
    type: 'timeInterval';
    repeats: boolean;
    seconds: number;
}
export interface DailyTriggerInput {
    type: 'daily';
    hour: number;
    minute: number;
}
export interface DateTriggerInput {
    type: 'date';
    timestamp: number;
}
export declare type NotificationTriggerInput = null | DateTriggerInput | CalendarTriggerInput | TimeIntervalTriggerInput | DailyTriggerInput;
