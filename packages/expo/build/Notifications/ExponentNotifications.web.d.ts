import { LocalNotification } from './Notifications.types';
import './ExponentNotifications.fx.web';
declare const _default: {
    presentLocalNotification(notification: LocalNotification): Promise<import("react").ReactText>;
    scheduleLocalNotification(notification: any, options?: {
        time?: number | Date | undefined;
        repeat?: "minute" | "hour" | "day" | "week" | "month" | "year" | undefined;
        intervalMs?: number | undefined;
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
