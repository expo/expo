import { UnavailabilityError } from 'expo-modules-core';
import NotificationCategoriesModule from './NotificationCategoriesModule.native';
export default async function getNotificationCategoriesAsync() {
    if (!NotificationCategoriesModule.getNotificationCategoriesAsync) {
        throw new UnavailabilityError('Notifications', 'getNotificationCategoriesAsync');
    }
    return await NotificationCategoriesModule.getNotificationCategoriesAsync();
}
//# sourceMappingURL=getNotificationCategoriesAsync.js.map