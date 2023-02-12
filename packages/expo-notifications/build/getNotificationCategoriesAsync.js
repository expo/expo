import { UnavailabilityError } from 'expo-modules-core';
import NotificationCategoriesModule from './NotificationCategoriesModule.native';
/**
 * Fetches information about all known notification categories.
 * @return A Promise which resolves to an array of `NotificationCategory`s. On platforms that do not support notification channels,
 * it will always resolve to an empty array.
 * @platform android
 * @platform ios
 * @header categories
 */
export default async function getNotificationCategoriesAsync() {
    if (!NotificationCategoriesModule.getNotificationCategoriesAsync) {
        throw new UnavailabilityError('Notifications', 'getNotificationCategoriesAsync');
    }
    return await NotificationCategoriesModule.getNotificationCategoriesAsync();
}
//# sourceMappingURL=getNotificationCategoriesAsync.js.map