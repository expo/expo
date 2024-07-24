import { UnavailabilityError } from 'expo/internal';
const notificationCategoriesModule = {
    async getNotificationCategoriesAsync() {
        return [];
    },
    async setNotificationCategoryAsync() {
        throw new UnavailabilityError('Notifications', 'setNotificationCategoryAsync');
    },
    async deleteNotificationCategoryAsync() {
        return false;
    },
    addListener() { },
    removeListeners() { },
};
export default notificationCategoriesModule;
//# sourceMappingURL=NotificationCategoriesModule.js.map
