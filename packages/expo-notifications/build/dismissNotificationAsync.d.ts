/**
 * Removes notification displayed in the notification tray (Notification Center).
 * @param notificationIdentifier The notification identifier, obtained either via `setNotificationHandler` method or in the listener added with `addNotificationReceivedListener`.
 * @return A Promise which resolves once the request to dismiss the notification is successfully dispatched to the notifications manager.
 * @header dismiss
 */
export default function dismissNotificationAsync(notificationIdentifier: string): Promise<void>;
//# sourceMappingURL=dismissNotificationAsync.d.ts.map