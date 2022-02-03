import { UnavailabilityError } from 'expo-modules-core';

import NotificationScheduler from './NotificationScheduler';
import { SchedulableNotificationTriggerInput } from './Notifications.types';
import { parseTrigger } from './scheduleNotificationAsync';

export default async function getNextTriggerDateAsync(
  trigger: SchedulableNotificationTriggerInput
): Promise<number | null> {
  if (!NotificationScheduler.getNextTriggerDateAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'getNextTriggerDateAsync');
  }

  return await NotificationScheduler.getNextTriggerDateAsync(parseTrigger(trigger));
}
