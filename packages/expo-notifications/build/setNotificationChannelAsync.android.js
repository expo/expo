import { UnavailabilityError } from 'expo-modules-core';
import NotificationChannelManager from './NotificationChannelManager';
export default async function setNotificationChannelAsync(channelId, channel) {
    if (!NotificationChannelManager.setNotificationChannelAsync) {
        throw new UnavailabilityError('Notifications', 'setNotificationChannelAsync');
    }
    return await NotificationChannelManager.setNotificationChannelAsync(channelId, channel);
}
//# sourceMappingURL=setNotificationChannelAsync.android.js.map