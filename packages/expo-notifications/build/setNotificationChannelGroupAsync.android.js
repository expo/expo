import { UnavailabilityError } from 'expo-modules-core';
import NotificationChannelGroupManager from './NotificationChannelGroupManager';
export default async function setNotificationChannelGroupAsync(groupId, group) {
    if (!NotificationChannelGroupManager.setNotificationChannelGroupAsync) {
        throw new UnavailabilityError('Notifications', 'setNotificationChannelGroupAsync');
    }
    return await NotificationChannelGroupManager.setNotificationChannelGroupAsync(groupId, group);
}
//# sourceMappingURL=setNotificationChannelGroupAsync.android.js.map