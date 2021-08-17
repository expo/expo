import { UnavailabilityError } from 'expo-modules-core';
import NotificationScheduler from './NotificationScheduler';
import { parseTrigger } from './scheduleNotificationAsync';
export default async function getNextTriggerDateAsync(trigger) {
    if (!NotificationScheduler.getNextTriggerDateAsync) {
        throw new UnavailabilityError('ExpoNotifications', 'getNextTriggerDateAsync');
    }
    return await NotificationScheduler.getNextTriggerDateAsync(parseTrigger(trigger));
}
//# sourceMappingURL=getNextTriggerDateAsync.js.map