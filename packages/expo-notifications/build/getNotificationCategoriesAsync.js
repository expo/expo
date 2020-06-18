import { UnavailabilityError } from '@unimodules/core';
import NotificationCategoriesModule from './NotificationCategoriesModule';
export default async function getNotificationCategoriesAsync() {
    if (!NotificationCategoriesModule.getNotificationCategoriesAsync) {
        throw new UnavailabilityError('Notifications', 'getNotificationCategoriesAsync');
    }
    return await NotificationCategoriesModule.getNotificationCategoriesAsync();
}
//# sourceMappingURL=getNotificationCategoriesAsync.js.map