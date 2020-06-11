import { UnavailabilityError, Platform } from '@unimodules/core';
import NotificationCategoriesModule from './NotificationCategoriesModule';
export async function getCategoriesAsync() {
    if (!NotificationCategoriesModule.getCategoriesAsync) {
        throw new UnavailabilityError('Notifications', 'getCategoriesAsync');
    }
    return await NotificationCategoriesModule.getCategoriesAsync();
}
export async function createCategoryAsync(name, actions, previewPlaceholder) {
    if (!NotificationCategoriesModule.createCategoryAsync) {
        throw new UnavailabilityError('Notifications', 'createCategoryAsync');
    }
    return Platform.OS === 'ios'
        ? await NotificationCategoriesModule.createCategoryAsync(name, actions, previewPlaceholder)
        : await NotificationCategoriesModule.createCategoryAsync(name, actions);
}
export async function deleteCategoryAsync(name) {
    if (!NotificationCategoriesModule.deleteCategoryAsync) {
        throw new UnavailabilityError('Notifications', 'deleteCategoryAsync');
    }
    return await NotificationCategoriesModule.deleteCategoryAsync(name);
}
//# sourceMappingURL=NotificationCategories.js.map