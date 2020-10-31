import { NotificationResponse } from './Notifications.types';
/**
 * Return a notification response most recently
 * caught by the ever-running shared response listener
 */
export declare function getLastNotificationResponse(): NotificationResponse | undefined;
