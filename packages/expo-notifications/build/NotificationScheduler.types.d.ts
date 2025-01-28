import { ProxyNativeModule } from 'expo-modules-core';
import { NotificationRequest, NotificationContentInput } from './Notifications.types';
type CalendarTriggerInputValue = {
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
export interface NotificationSchedulerModule extends ProxyNativeModule {
    getAllScheduledNotificationsAsync?: () => Promise<NotificationRequest[]>;
    scheduleNotificationAsync?: (identifier: string, notificationContent: NotificationContentInput, trigger: NativeNotificationTriggerInput) => Promise<string>;
    cancelScheduledNotificationAsync?: (identifier: string) => Promise<void>;
    cancelAllScheduledNotificationsAsync?: () => Promise<void>;
    getNextTriggerDateAsync?: (trigger: NativeNotificationTriggerInput) => Promise<number>;
}
export interface NativeChannelAwareTriggerInput {
    type: 'channel';
    channelId?: string;
}
export interface NativeCalendarTriggerInput {
    type: 'calendar';
    channelId?: string;
    repeats?: boolean;
    value: CalendarTriggerInputValue;
}
export interface NativeTimeIntervalTriggerInput {
    type: 'timeInterval';
    channelId?: string;
    repeats: boolean;
    seconds: number;
}
export interface NativeDailyTriggerInput {
    type: 'daily';
    channelId?: string;
    hour: number;
    minute: number;
}
export interface NativeWeeklyTriggerInput {
    type: 'weekly';
    channelId?: string;
    weekday: number;
    hour: number;
    minute: number;
}
export interface NativeYearlyTriggerInput {
    type: 'yearly';
    channelId?: string;
    day: number;
    month: number;
    hour: number;
    minute: number;
}
export interface NativeMonthlyTriggerInput {
    type: 'monthly';
    channelId?: string;
    day: number;
    hour: number;
    minute: number;
}
export interface NativeDateTriggerInput {
    type: 'date';
    channelId?: string;
    timestamp: number;
}
export type NativeNotificationTriggerInput = null | NativeChannelAwareTriggerInput | NativeDateTriggerInput | NativeCalendarTriggerInput | NativeTimeIntervalTriggerInput | NativeDailyTriggerInput | NativeWeeklyTriggerInput | NativeMonthlyTriggerInput | NativeYearlyTriggerInput;
export {};
//# sourceMappingURL=NotificationScheduler.types.d.ts.map