import { UnavailabilityError } from 'expo-modules-core';

import NotificationCategoriesModule from './NotificationCategoriesModule.native';
import { NotificationCategory } from './Notifications.types';

export default async function getNotificationCategoriesAsync(): Promise<NotificationCategory[]> {
  if (!NotificationCategoriesModule.getNotificationCategoriesAsync) {
    throw new UnavailabilityError('Notifications', 'getNotificationCategoriesAsync');
  }

  return await NotificationCategoriesModule.getNotificationCategoriesAsync();
}
