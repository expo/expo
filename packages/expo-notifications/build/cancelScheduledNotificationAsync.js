import { UnavailabilityError } from 'expo-modules-core';
import NotificationScheduler from './NotificationScheduler';
export default async function cancelScheduledNotificationAsync(identifier) {
    if (!NotificationScheduler.cancelScheduledNotificationAsync) {
        throw new UnavailabilityError('Notifications', 'cancelScheduledNotificationAsync');
    }
    return await NotificationScheduler.cancelScheduledNotificationAsync(identifier);
}
//# sourceMappingURL=cancelScheduledNotificationAsync.js.map