import { UnavailabilityError, Platform } from '@unimodules/core';
import NotificationCategoriesModule from './NotificationCategoriesModule';
export default async function setNotificationCategoryAsync(identifier, actions, options) {
    if (!NotificationCategoriesModule.setNotificationCategoryAsync) {
        throw new UnavailabilityError('Notifications', 'setNotificationCategoryAsync');
    }
    return Platform.OS === 'ios'
        ? await NotificationCategoriesModule.setNotificationCategoryAsync(identifier, actions, options)
        : await NotificationCategoriesModule.setNotificationCategoryAsync(identifier, actions);
}
//# sourceMappingURL=setNotificationCategoryAsync.js.map