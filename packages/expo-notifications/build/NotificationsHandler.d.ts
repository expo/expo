import { CodedError } from '@unimodules/core';
import { Notification } from './NotificationsEmitter.types';
import { BaseNotificationBehavior, IosNotificationBehavior, AndroidNotificationBehavior } from './NotificationsHandlerModule';
export declare class NotificationTimeoutError extends CodedError {
    info: {
        notification: Notification;
        id: string;
    };
    constructor(notificationId: string, notification: Notification);
}
export declare type NotificationHandlingError = NotificationTimeoutError | Error;
export interface NotificationBehavior extends BaseNotificationBehavior {
    ios?: IosNotificationBehavior;
    android?: AndroidNotificationBehavior;
}
export interface NotificationHandler {
    handleNotification: (notification: Notification) => Promise<NotificationBehavior>;
    handleSuccess?: (notificationId: string) => void;
    handleError?: (notificationId: string, error: NotificationHandlingError) => void;
}
export declare function setNotificationHandler(handler: NotificationHandler | null): void;
