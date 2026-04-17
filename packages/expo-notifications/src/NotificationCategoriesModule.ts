import { UnavailabilityError } from 'expo-modules-core';

import { NotificationCategoriesModule } from './NotificationCategoriesModule.types';

const notificationCategoriesModule: NotificationCategoriesModule = {
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
  addListener() {},
  removeListeners() {},
};

export default notificationCategoriesModule;
