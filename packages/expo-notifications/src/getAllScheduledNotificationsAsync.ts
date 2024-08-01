import { UnavailabilityError } from 'expo-modules-core';

import NotificationScheduler from './NotificationScheduler';
import { NotificationRequest } from './Notifications.types';

/**
 * Fetches information about all scheduled notifications.
 * @return Returns a Promise resolving to an array of objects conforming to the [`Notification`](#notification) interface.
 * @header schedule
 */
export default async function getAllScheduledNotificationsAsync(): Promise<NotificationRequest[]> {
  if (!NotificationScheduler.getAllScheduledNotificationsAsync) {
    throw new UnavailabilityError('Notifications', 'getAllScheduledNotificationsAsync');
  }

  return await NotificationScheduler.getAllScheduledNotificationsAsync();
}
