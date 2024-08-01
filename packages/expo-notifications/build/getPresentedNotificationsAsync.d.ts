import { Notification } from './Notifications.types';
/**
 * Fetches information about all notifications present in the notification tray (Notification Center).
 * > This method is not supported on Android below 6.0 (API level 23) – on these devices it will resolve to an empty array.
 * @return A Promise which resolves with a list of notifications ([`Notification`](#notification)) currently present in the notification tray (Notification Center).
 * @header dismiss
 */
export default function getPresentedNotificationsAsync(): Promise<Notification[]>;
//# sourceMappingURL=getPresentedNotificationsAsync.d.ts.map