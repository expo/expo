import { UnavailabilityError } from 'expo-modules-core';
import NotificationScheduler from './NotificationScheduler';
export default async function getAllScheduledNotificationsAsync() {
    if (!NotificationScheduler.getAllScheduledNotificationsAsync) {
        throw new UnavailabilityError('Notifications', 'getAllScheduledNotificationsAsync');
    }
    return await NotificationScheduler.getAllScheduledNotificationsAsync();
}
//# sourceMappingURL=getAllScheduledNotificationsAsync.js.map