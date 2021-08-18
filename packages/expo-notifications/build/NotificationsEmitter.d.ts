import { Subscription } from 'expo-modules-core';
import { Notification, NotificationResponse } from './Notifications.types';
export declare const DEFAULT_ACTION_IDENTIFIER = "expo.modules.notifications.actions.DEFAULT";
export declare function addNotificationReceivedListener(listener: (event: Notification) => void): Subscription;
export declare function addNotificationsDroppedListener(listener: () => void): Subscription;
export declare function addNotificationResponseReceivedListener(listener: (event: NotificationResponse) => void): Subscription;
export declare function removeNotificationSubscription(subscription: Subscription): void;
export declare function getLastNotificationResponseAsync(): Promise<NotificationResponse | null>;
