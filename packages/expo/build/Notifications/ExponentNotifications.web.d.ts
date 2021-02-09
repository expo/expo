import { LocalNotification, LocalNotificationId } from './Notifications.types';
import './ExponentNotifications.fx.web';
declare const _default: {
    presentLocalNotification(notification: LocalNotification): Promise<LocalNotificationId>;
    scheduleLocalNotification(notification: any, options?: {
        time?: Date | number;
        repeat?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
        intervalMs?: number;
    }): Promise<string>;
    dismissNotification(notificationId?: string | undefined): Promise<void>;
    dismissAllNotifications(): Promise<void>;
    cancelScheduledNotificationAsync(notificationId: string): Promise<void>;
    cancelAllScheduledNotificationsAsync(): Promise<void>;
    getExponentPushTokenAsync(): Promise<string>;
    getDevicePushTokenAsync(): Promise<{
        type: string;
        data: object;
    }>;
    getBadgeNumberAsync(): Promise<number>;
    setBadgeNumberAsync(badgeNumber: number): Promise<void>;
};
export default _default;
