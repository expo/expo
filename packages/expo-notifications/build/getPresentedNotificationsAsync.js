import { UnavailabilityError } from 'expo-modules-core';
import NotificationPresenter from './NotificationPresenterModule';
/**
 * Fetches information about all notifications present in the notification tray (Notification Center).
 * > This method is not supported on Android below 6.0 (API level 23) – on these devices it will resolve to an empty array.
 * @return A Promise which resolves with a list of notifications ([`Notification`](#notification)) currently present in the notification tray (Notification Center).
 * @header dismiss
 */
export default async function getPresentedNotificationsAsync() {
    if (!NotificationPresenter.getPresentedNotificationsAsync) {
        throw new UnavailabilityError('Notifications', 'getPresentedNotificationsAsync');
    }
    return await NotificationPresenter.getPresentedNotificationsAsync();
}
//# sourceMappingURL=getPresentedNotificationsAsync.js.map