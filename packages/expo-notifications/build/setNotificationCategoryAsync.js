import { UnavailabilityError, Platform } from '@unimodules/core';
import NotificationCategoriesModule from './NotificationCategoriesModule';
export default async function setNotificationCategoryAsync(name, actions, previewPlaceholder) {
    if (!NotificationCategoriesModule.setNotificationCategoryAsync) {
        throw new UnavailabilityError('Notifications', 'setNotificationCategoryAsync');
    }
    return Platform.OS === 'ios'
        ? await NotificationCategoriesModule.setNotificationCategoryAsync(name, actions, previewPlaceholder)
        : await NotificationCategoriesModule.setNotificationCategoryAsync(name, actions);
}
//# sourceMappingURL=setNotificationCategoryAsync.js.map