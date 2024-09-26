import { UnavailabilityError } from 'expo-modules-core';
import NotificationScheduler from './NotificationScheduler';
import { mapNotificationRequest } from './utils/mapNotificationResponse';
/**
 * Fetches information about all scheduled notifications.
 * @return Returns a Promise resolving to an array of objects conforming to the [`Notification`](#notification) interface.
 * @header schedule
 */
export default async function getAllScheduledNotificationsAsync() {
    if (!NotificationScheduler.getAllScheduledNotificationsAsync) {
        throw new UnavailabilityError('Notifications', 'getAllScheduledNotificationsAsync');
    }
    return (await NotificationScheduler.getAllScheduledNotificationsAsync()).map((request) => mapNotificationRequest(request));
}
//# sourceMappingURL=getAllScheduledNotificationsAsync.js.map