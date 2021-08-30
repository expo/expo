import { UnavailabilityError } from 'expo-modules-core';

import NotificationScheduler from './NotificationScheduler';

export default async function cancelScheduledNotificationAsync(identifier: string): Promise<void> {
  if (!NotificationScheduler.cancelScheduledNotificationAsync) {
    throw new UnavailabilityError('Notifications', 'cancelScheduledNotificationAsync');
  }

  return await NotificationScheduler.cancelScheduledNotificationAsync(identifier);
}
