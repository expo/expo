import { EventSubscription } from 'fbemitter';
import { Notification, LocalNotification, Channel, ActionType } from './Notifications.types';
declare const _default: {
    _setInitialNotification(notification: Notification): void;
    createCategoryAsync(categoryId: string, actions: ActionType[]): Promise<void>;
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
};
export default _default;
