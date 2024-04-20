import { UnavailabilityError } from 'expo-modules-core';
import NotificationCategoriesModule from './NotificationCategoriesModule';
/**
 * Sets the new notification category.
 * @param identifier A string to associate as the ID of this category. You will pass this string in as the `categoryIdentifier`
 * in your [`NotificationContent`](#notificationcontent) to associate a notification with this category.
 * > Don't use the characters `:` or `-` in your category identifier. If you do, categories might not work as expected.
 * @param actions An array of [`NotificationAction`s](#notificationaction), which describe the actions associated with this category.
 * @param options An optional object of additional configuration options for your category.
 * @return A Promise which resolves to the category you just have created, or null on web
 * @platform android
 * @platform ios
 * @platform web
 * @header categories
 */
export default async function setNotificationCategoryAsync(identifier, actions, options) {
    if (!NotificationCategoriesModule.setNotificationCategoryAsync) {
        throw new UnavailabilityError('Notifications', 'setNotificationCategoryAsync');
    }
    return await NotificationCategoriesModule.setNotificationCategoryAsync(identifier, actions, options);
}
//# sourceMappingURL=setNotificationCategoryAsync.js.map