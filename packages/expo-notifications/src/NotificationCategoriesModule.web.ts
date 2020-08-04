import { NotificationAction } from './Notifications.types';

export default {
  async getNotificationCategoriesAsync(): Promise<null> {
    return null;
  },
  async setNotificationCategoryAsync(
    identifier: string,
    actions: NotificationAction[],
    options?: object
  ): Promise<null> {
    return null;
  },
  async deleteNotificationCategoryAsync(identifier: string): Promise<null> {
    return null;
  },
};
