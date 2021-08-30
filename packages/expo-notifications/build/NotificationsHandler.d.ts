import { CodedError } from 'expo-modules-core';
import { Notification, NotificationBehavior } from './Notifications.types';
export declare class NotificationTimeoutError extends CodedError {
    info: {
        notification: Notification;
        id: string;
    };
    constructor(notificationId: string, notification: Notification);
}
export declare type NotificationHandlingError = NotificationTimeoutError | Error;
export interface NotificationHandler {
    handleNotification: (notification: Notification) => Promise<NotificationBehavior>;
    handleSuccess?: (notificationId: string) => void;
    handleError?: (notificationId: string, error: NotificationHandlingError) => void;
}
export declare function setNotificationHandler(handler: NotificationHandler | null): void;
