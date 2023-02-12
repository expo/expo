import { ProxyNativeModule } from 'expo-modules-core';
import { NotificationRequest, NotificationContentInput } from './Notifications.types';
export interface NotificationSchedulerModule extends ProxyNativeModule {
    getAllScheduledNotificationsAsync?: () => Promise<NotificationRequest[]>;
    scheduleNotificationAsync?: (identifier: string, notificationContent: NotificationContentInput, trigger: NotificationTriggerInput) => Promise<string>;
    cancelScheduledNotificationAsync?: (identifier: string) => Promise<void>;
    cancelAllScheduledNotificationsAsync?: () => Promise<void>;
    getNextTriggerDateAsync?: (trigger: NotificationTriggerInput) => Promise<number>;
}
export interface ChannelAwareTriggerInput {
    type: 'channel';
    channelId?: string;
}
export interface CalendarTriggerInput {
    type: 'calendar';
    channelId?: string;
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
    channelId?: string;
    repeats: boolean;
    seconds: number;
}
export interface DailyTriggerInput {
    type: 'daily';
    channelId?: string;
    hour: number;
    minute: number;
}
export interface WeeklyTriggerInput {
    type: 'weekly';
    channelId?: string;
    weekday: number;
    hour: number;
    minute: number;
}
export interface YearlyTriggerInput {
    type: 'yearly';
    channelId?: string;
    day: number;
    month: number;
    hour: number;
    minute: number;
}
export interface DateTriggerInput {
    type: 'date';
    channelId?: string;
    timestamp: number;
}
export type NotificationTriggerInput = null | ChannelAwareTriggerInput | DateTriggerInput | CalendarTriggerInput | TimeIntervalTriggerInput | DailyTriggerInput | WeeklyTriggerInput | YearlyTriggerInput;
//# sourceMappingURL=NotificationScheduler.types.d.ts.map