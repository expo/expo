import { UnavailabilityError } from '@unimodules/core';

import NotificationCategoriesModule from './NotificationCategoriesModule';

export default async function deleteNotificationCategoryAsync(identifier: string): Promise<void> {
  if (!NotificationCategoriesModule.deleteNotificationCategoryAsync) {
    throw new UnavailabilityError('Notifications', 'deleteNotificationCategoryAsync');
  }

  return await NotificationCategoriesModule.deleteNotificationCategoryAsync(identifier);
}
