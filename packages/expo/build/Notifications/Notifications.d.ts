import { EventSubscription } from 'fbemitter';
import { Notification, LocalNotification, Channel, ActionType, LocalNotificationId } from './Notifications.types';
export declare function emitNotification(notification: any): void;
declare const _default: {
    _setInitialNotification(notification: Notification): void;
    createCategoryAsync(categoryId: string, actions: ActionType[], previewPlaceholder?: string | undefined): Promise<void>;
    deleteCategoryAsync(categoryId: string): Promise<void>;
    getExpoPushTokenAsync(): Promise<string>;
    getDevicePushTokenAsync: (config: {
        gcmSenderId?: string;
    }) => Promise<{
        type: string;
        data: string;
    }>;
    createChannelAndroidAsync(id: string, channel: Channel): Promise<void>;
    deleteChannelAndroidAsync(id: string): Promise<void>;
    presentLocalNotificationAsync(notification: LocalNotification): Promise<LocalNotificationId>;
    scheduleLocalNotificationAsync(notification: LocalNotification, options?: {
        time?: Date | number;
        repeat?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
        intervalMs?: number;
    }): Promise<LocalNotificationId>;
    dismissNotificationAsync(notificationId: LocalNotificationId): Promise<void>;
    dismissAllNotificationsAsync(): Promise<void>;
    cancelScheduledNotificationAsync(notificationId: LocalNotificationId): Promise<void>;
    cancelAllScheduledNotificationsAsync(): Promise<void>;
    addListener(listener: (notification: Notification) => unknown): EventSubscription;
    getBadgeNumberAsync(): Promise<number>;
    setBadgeNumberAsync(number: number): Promise<void>;
    scheduleNotificationWithCalendarAsync(notification: LocalNotification, options?: {
        year?: number;
        month?: number;
        hour?: number;
        day?: number;
        minute?: number;
        second?: number;
        weekDay?: number;
        repeat?: boolean;
    }): Promise<string>;
    scheduleNotificationWithTimerAsync(notification: LocalNotification, options: {
        interval: number;
        repeat?: boolean;
    }): Promise<string>;
};
export default _default;
