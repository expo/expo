import { UnavailabilityError } from '@unimodules/core';

import NotificationCategoriesModule from './NotificationCategoriesModule.native';

export default async function deleteNotificationCategoryAsync(
  identifier: string
): Promise<boolean> {
  if (!NotificationCategoriesModule.deleteNotificationCategoryAsync) {
    throw new UnavailabilityError('Notifications', 'deleteNotificationCategoryAsync');
  }

  return await NotificationCategoriesModule.deleteNotificationCategoryAsync(identifier);
}
