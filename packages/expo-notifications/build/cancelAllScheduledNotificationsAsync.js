import { UnavailabilityError } from '@unimodules/core';
import NotificationScheduler from './NotificationScheduler';
export default async function cancelAllScheduledNotificationsAsync() {
    if (!NotificationScheduler.cancelAllScheduledNotificationsAsync) {
        throw new UnavailabilityError('Notifications', 'cancelAllScheduledNotificationsAsync');
    }
    return await NotificationScheduler.cancelAllScheduledNotificationsAsync();
}
//# sourceMappingURL=cancelAllScheduledNotificationsAsync.js.map