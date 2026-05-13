import { UnavailabilityError } from 'expo-modules-core';
import NotificationChannelManager from './NotificationChannelManager';
export async function deleteNotificationChannelAsync(channelId) {
    if (!NotificationChannelManager.deleteNotificationChannelAsync) {
        throw new UnavailabilityError('Notifications', 'deleteNotificationChannelAsync');
    }
    return await NotificationChannelManager.deleteNotificationChannelAsync(channelId);
}
//# sourceMappingURL=deleteNotificationChannelAsync.android.js.map