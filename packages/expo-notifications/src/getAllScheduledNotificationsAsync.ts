import { UnavailabilityError } from 'expo-modules-core';

import NotificationScheduler from './NotificationScheduler';
import { NotificationRequest } from './Notifications.types';

export default async function getAllScheduledNotificationsAsync(): Promise<NotificationRequest[]> {
  if (!NotificationScheduler.getAllScheduledNotificationsAsync) {
    throw new UnavailabilityError('Notifications', 'getAllScheduledNotificationsAsync');
  }

  return await NotificationScheduler.getAllScheduledNotificationsAsync();
}
