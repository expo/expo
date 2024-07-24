import { UnavailabilityError } from 'expo/internal';
import PushTokenManager from './PushTokenManager';
// @docsMissing
export default async function unregisterForNotificationsAsync() {
    if (!PushTokenManager.unregisterForNotificationsAsync) {
        throw new UnavailabilityError('ExpoNotifications', 'unregisterForNotificationsAsync');
    }
    return PushTokenManager.unregisterForNotificationsAsync();
}
//# sourceMappingURL=unregisterForNotificationsAsync.js.map
