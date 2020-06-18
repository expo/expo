import { UnavailabilityError, Platform } from '@unimodules/core';
import NotificationCategoriesModule from './NotificationCategoriesModule';
export async function getNotificationCategoriesAsync() {
    if (!NotificationCategoriesModule.getNotificationCategoriesAsync) {
        throw new UnavailabilityError('Notifications', 'getNotificationCategoriesAsync');
    }
    return await NotificationCategoriesModule.getNotificationCategoriesAsync();
}
export async function setNotificationCategoryAsync(name, actions, previewPlaceholder) {
    if (!NotificationCategoriesModule.setNotificationCategoryAsync) {
        throw new UnavailabilityError('Notifications', 'setNotificationCategoryAsync');
    }
    return Platform.OS === 'ios'
        ? await NotificationCategoriesModule.setNotificationCategoryAsync(name, actions, previewPlaceholder)
        : await NotificationCategoriesModule.setNotificationCategoryAsync(name, actions);
}
export async function deleteNotificationCategoryAsync(identifier) {
    if (!NotificationCategoriesModule.deleteNotificationCategoryAsync) {
        throw new UnavailabilityError('Notifications', 'deleteNotificationCategoryAsync');
    }
    return await NotificationCategoriesModule.deleteNotificationCategoryAsync(identifier);
}
//# sourceMappingURL=NotificationCategories.js.map