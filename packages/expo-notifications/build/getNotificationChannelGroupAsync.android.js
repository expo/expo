import { UnavailabilityError } from 'expo-modules-core';
import NotificationChannelGroupManager from './NotificationChannelGroupManager';
export default async function getNotificationChannelGroupAsync(groupId) {
    if (!NotificationChannelGroupManager.getNotificationChannelGroupAsync) {
        throw new UnavailabilityError('Notifications', 'getNotificationChannelGroupAsync');
    }
    return await NotificationChannelGroupManager.getNotificationChannelGroupAsync(groupId);
}
//# sourceMappingURL=getNotificationChannelGroupAsync.android.js.map