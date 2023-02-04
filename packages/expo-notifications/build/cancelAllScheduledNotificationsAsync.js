import { UnavailabilityError } from 'expo-modules-core';
import NotificationScheduler from './NotificationScheduler';
/**
 * Cancels all scheduled notifications.
 * @return A Promise that resolves once all the scheduled notifications are successfully canceled, or if there are no scheduled notifications.
 * @header schedule
 */
export default async function cancelAllScheduledNotificationsAsync() {
    if (!NotificationScheduler.cancelAllScheduledNotificationsAsync) {
        throw new UnavailabilityError('Notifications', 'cancelAllScheduledNotificationsAsync');
    }
    return await NotificationScheduler.cancelAllScheduledNotificationsAsync();
}
//# sourceMappingURL=cancelAllScheduledNotificationsAsync.js.map