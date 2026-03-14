import { UnavailabilityError } from 'expo-modules-core';
const notificationCategoriesModule = {
    async getNotificationCategoriesAsync() {
        return [];
    },
    async setNotificationCategoryAsync() {
        throw new UnavailabilityError('Notifications', 'setNotificationCategoryAsync');
    },
    async setNotificationCategoriesAsync() {
        throw new UnavailabilityError('Notifications', 'setNotificationCategoriesAsync');
    },
    async deleteNotificationCategoryAsync() {
        return false;
    },
    addListener() { },
    removeListeners() { },
};
export default notificationCategoriesModule;
//# sourceMappingURL=NotificationCategoriesModule.js.map