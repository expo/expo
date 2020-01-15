import { Subscription } from '@unimodules/core';
import { Notification, NotificationResponse } from './NotificationsEmitter.types';
interface NotificationReceivedEvent {
    type: 'notificationReceived';
    notification: Notification;
}
interface NotificationResponseEvent {
    type: 'notificationResponseReceived';
    response: NotificationResponse;
}
interface NotificationsDroppedEvent {
    type: 'notificationsDropped';
}
export declare type NotificationEvent = NotificationReceivedEvent | NotificationResponseEvent | NotificationsDroppedEvent;
export declare type NotificationListener = (notification: NotificationEvent) => void;
export declare function addNotificationListener(listener: NotificationListener): Subscription;
export declare function removeNotificationSubscription(subscription: Subscription): void;
export declare function removeAllNotificationListeners(): void;
export {};
