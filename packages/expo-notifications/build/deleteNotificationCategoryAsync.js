import { UnavailabilityError } from '@unimodules/core';
import NotificationCategoriesModule from './NotificationCategoriesModule';
export default async function deleteNotificationCategoryAsync(identifier) {
    if (!NotificationCategoriesModule.deleteNotificationCategoryAsync) {
        throw new UnavailabilityError('Notifications', 'deleteNotificationCategoryAsync');
    }
    return await NotificationCategoriesModule.deleteNotificationCategoryAsync(identifier);
}
//# sourceMappingURL=deleteNotificationCategoryAsync.js.map