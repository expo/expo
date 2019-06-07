import { EventSubscription } from 'fbemitter';
import { Notification, LocalNotification, Channel, ActionType, LocalNotificationId, OnUserInteractionListener, OnForegroundNotificationListener } from './Notifications.types';
export declare function createCategoryAsync(categoryId: string, actions: ActionType[]): Promise<void>;
export declare function deleteCategoryAsync(categoryId: string): Promise<void>;
export declare function getExpoPushTokenAsync(): Promise<string>;
export declare function getDevicePushTokenAsync(config: {
    gcmSenderId?: string;
}): Promise<{
    type: string;
    data: string;
}>;
export declare function createChannelAndroidAsync(id: string, channel: Channel): Promise<void>;
export declare function deleteChannelAndroidAsync(id: string): Promise<void>;
/**
 * @remarks
 * Shows a notification instantly
 */
export declare function presentLocalNotificationAsync(notification: LocalNotification): Promise<LocalNotificationId>;
/**
 * @remarks
 * Schedule a notification at a later date
 */
export declare function scheduleLocalNotificationAsync(notification: LocalNotification, options?: {
    time?: Date | number;
    repeat?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
    intervalMs?: number;
}): Promise<LocalNotificationId>;
/**
 * @remarks
 * Dismiss currently shown notification with ID (Android only)
 */
export declare function dismissNotificationAsync(notificationId: LocalNotificationId): Promise<void>;
/**
 * @remarks
 * Dismiss all currently shown notifications (Android only)
 */
export declare function dismissAllNotificationsAsync(): Promise<void>;
/**
 * @remarks
 * Cancel scheduled notification notification with ID
 */
export declare function cancelScheduledNotificationAsync(notificationId: LocalNotificationId): Promise<void>;
/**
 * @remarks
 * Cancel all scheduled notifications
 */
export declare function cancelAllScheduledNotificationsAsync(): Promise<void>;
export declare function setBadgeNumberAsync(number: number): Promise<void>;
export declare function addOnUserInteractionListener(listenerName: string, listener: OnUserInteractionListener): void;
export declare function addOnForegroundNotificationListener(listenerName: string, listener: OnForegroundNotificationListener): void;
export declare function removeOnUserInteractionListener(listenerName: string): void;
export declare function removeOnForegroundNotificationListener(listenerName: string): void;
export declare function scheduleNotificationWithCalendarAsync(notification: LocalNotification, options?: {
    year?: number;
    month?: number;
    hour?: number;
    day?: number;
    minute?: number;
    second?: number;
    weekDay?: number;
    repeat?: boolean;
}): Promise<string>;
export declare function scheduleNotificationWithTimerAsync(notification: LocalNotification, options: {
    interval: number;
    repeat?: boolean;
}): Promise<string>;
export declare function addListener(listener: (notification: Notification) => unknown): EventSubscription;
export declare function emitNotification(notification: Notification): void;
