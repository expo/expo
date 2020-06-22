import { UnavailabilityError } from '@unimodules/core';

import NotificationScheduler from './NotificationScheduler';

export default async function cancelAllScheduledNotificationsAsync(): Promise<void> {
  if (!NotificationScheduler.cancelAllScheduledNotificationsAsync) {
    throw new UnavailabilityError('Notifications', 'cancelAllScheduledNotificationsAsync');
  }

  return await NotificationScheduler.cancelAllScheduledNotificationsAsync();
}
