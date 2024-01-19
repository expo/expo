import { NotificationAction } from './Notifications.types';

export default {
  async getNotificationCategoriesAsync(): Promise<never[]> {
    return [];
  },
  async setNotificationCategoryAsync(
    identifier: string,
    actions: NotificationAction[],
    options?: object
  ): Promise<null> {
    return null;
  },
  async deleteNotificationCategoryAsync(identifier: string): Promise<boolean> {
    return false;
  },
};
