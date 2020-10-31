import { NotificationResponse } from './Notifications.types';
/**
 * Add listener to the ever-running shared response listener
 * @param listener Notification response listener
 */
export declare function addListener(listener: (response: NotificationResponse) => void): import("@unimodules/core").Subscription;
/**
 * Return a notification response most recently
 * caught by the ever-running shared response listener
 */
export declare function getLastNotificationResponse(): NotificationResponse | undefined;
