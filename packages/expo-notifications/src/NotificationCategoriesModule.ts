import { NotificationAction } from './Notifications.types';

export default {
  async getNotificationCategoriesAsync(): Promise<NotificationCategory[]> {
    return [];
  },
  async setNotificationCategoryAsync(
    identifier: string,
    actions: NotificationAction[],
    options?: object
  ): Promise<NotificationCategory | null> {
    return null;
  },
  async deleteNotificationCategoryAsync(identifier: string): Promise<boolean> {
    return false;
  },
};
