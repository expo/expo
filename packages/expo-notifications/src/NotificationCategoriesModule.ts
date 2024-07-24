import { UnavailabilityError } from 'expo/internal';

import { NotificationCategoriesModule } from './NotificationCategoriesModule.types';

const notificationCategoriesModule: NotificationCategoriesModule = {
  async getNotificationCategoriesAsync() {
    return [];
  },
  async setNotificationCategoryAsync() {
    throw new UnavailabilityError('Notifications', 'setNotificationCategoryAsync');
  },
  async deleteNotificationCategoryAsync() {
    return false;
  },
  addListener() {},
  removeListeners() {},
};

export default notificationCategoriesModule;
