import { UnavailabilityError } from '@unimodules/core';

import NotificationScheduler from './NotificationScheduler';
import { NotificationTriggerInput } from './Notifications.types';
import { parseTrigger } from './scheduleNotificationAsync';

export default async function getNextTriggerDateAsync(
  trigger: NotificationTriggerInput
): Promise<number | null> {
  if (!NotificationScheduler.getNextTriggerDateAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'getNextTriggerDateAsync');
  }

  return await NotificationScheduler.getNextTriggerDateAsync(parseTrigger(trigger));
}
