import { Subscription } from '@unimodules/core';
import { Notification, NotificationResponse } from './Notifications.types';
export declare const DEFAULT_ACTION_IDENTIFIER = "expo.modules.notifications.actions.DEFAULT";
export declare function addNotificationReceivedListener<T = any>(listener: (event: Notification<T>) => void): Subscription;
export declare function addNotificationsDroppedListener(listener: () => void): Subscription;
export declare function addNotificationResponseReceivedListener<T = any>(listener: (event: NotificationResponse<T>) => void): Subscription;
export declare function removeNotificationSubscription(subscription: Subscription): void;
export declare function removeAllNotificationListeners(): void;
