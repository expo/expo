import { UnavailabilityError } from 'expo-modules-core';

import NotificationCategoriesModule from './NotificationCategoriesModule.native';
import { NotificationCategory } from './Notifications.types';

/**
 * Fetches information about all known notification categories.
 * @return A Promise which resolves to an array of `NotificationCategory`s. On platforms that do not support notification channels,
 * it will always resolve to an empty array.
 * @platform android
 * @platform ios
 * @header categories
 */
export default async function getNotificationCategoriesAsync(): Promise<NotificationCategory[]> {
  if (!NotificationCategoriesModule.getNotificationCategoriesAsync) {
    throw new UnavailabilityError('Notifications', 'getNotificationCategoriesAsync');
  }

  return await NotificationCategoriesModule.getNotificationCategoriesAsync();
}
