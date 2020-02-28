import { EventSubscription } from 'fbemitter';
import { Notification, LocalNotification, Channel, ActionType } from './Notifications.types';
export declare function emitNotification(notification: any): void;
declare const _default: {
    _setInitialNotification(notification: Notification): void;
    createCategoryAsync(categoryId: string, actions: ActionType[], previewPlaceholder?: string | undefined): Promise<void>;
    deleteCategoryAsync(categoryId: string): Promise<void>;
    getExpoPushTokenAsync(): Promise<string>;
    getDevicePushTokenAsync: (config: {
        gcmSenderId?: string | undefined;
    }) => Promise<{
        type: string;
        data: string;
    }>;
    createChannelAndroidAsync(id: string, channel: Channel): Promise<void>;
    deleteChannelAndroidAsync(id: string): Promise<void>;
    presentLocalNotificationAsync(notification: LocalNotification): Promise<import("react").ReactText>;
    scheduleLocalNotificationAsync(notification: LocalNotification, options?: {
        time?: number | Date | undefined;
        repeat?: "minute" | "hour" | "day" | "week" | "month" | "year" | undefined;
        intervalMs?: number | undefined;
    }): Promise<import("react").ReactText>;
    dismissNotificationAsync(notificationId: import("react").ReactText): Promise<void>;
    dismissAllNotificationsAsync(): Promise<void>;
    cancelScheduledNotificationAsync(notificationId: import("react").ReactText): Promise<void>;
    cancelAllScheduledNotificationsAsync(): Promise<void>;
    addListener(listener: (notification: Notification) => unknown): EventSubscription;
    getBadgeNumberAsync(): Promise<number>;
    setBadgeNumberAsync(number: number): Promise<void>;
    scheduleNotificationWithCalendarAsync(notification: LocalNotification, options?: {
        year?: number | undefined;
        month?: number | undefined;
        hour?: number | undefined;
        day?: number | undefined;
        minute?: number | undefined;
        second?: number | undefined;
        weekDay?: number | undefined;
        repeat?: boolean | undefined;
    }): Promise<string>;
    scheduleNotificationWithTimerAsync(notification: LocalNotification, options: {
        interval: number;
        repeat?: boolean | undefined;
    }): Promise<string>;
};
export default _default;
