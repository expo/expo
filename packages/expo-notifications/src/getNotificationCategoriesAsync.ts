import { UnavailabilityError } from '@unimodules/core';

import NotificationCategoriesModule from './NotificationCategoriesModule';
import { NotificationCategory } from './Notifications.types';

export default async function getNotificationCategoriesAsync(): Promise<NotificationCategory[]> {
  if (!NotificationCategoriesModule.getNotificationCategoriesAsync) {
    throw new UnavailabilityError('Notifications', 'getNotificationCategoriesAsync');
  }

  return await NotificationCategoriesModule.getNotificationCategoriesAsync();
}
