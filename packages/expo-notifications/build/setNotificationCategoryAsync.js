import { UnavailabilityError } from 'expo-modules-core';
import NotificationCategoriesModule from './NotificationCategoriesModule.native';
export default async function setNotificationCategoryAsync(identifier, actions, options) {
    if (!NotificationCategoriesModule.setNotificationCategoryAsync) {
        throw new UnavailabilityError('Notifications', 'setNotificationCategoryAsync');
    }
    return await NotificationCategoriesModule.setNotificationCategoryAsync(identifier, actions, options);
}
//# sourceMappingURL=setNotificationCategoryAsync.js.map