import { UnavailabilityError } from '@unimodules/core';
import NotificationChannelGroupManager from './NotificationChannelGroupManager';
export default async function getNotificationChannelGroupsAsync() {
    if (!NotificationChannelGroupManager.getNotificationChannelGroupsAsync) {
        throw new UnavailabilityError('Notifications', 'getNotificationChannelGroupsAsync');
    }
    return await NotificationChannelGroupManager.getNotificationChannelGroupsAsync();
}
//# sourceMappingURL=getNotificationChannelGroupsAsync.android.js.map