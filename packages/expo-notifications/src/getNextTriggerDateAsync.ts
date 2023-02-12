import { UnavailabilityError } from 'expo-modules-core';

import NotificationScheduler from './NotificationScheduler';
import { SchedulableNotificationTriggerInput } from './Notifications.types';
import { parseTrigger } from './scheduleNotificationAsync';

/**
 * Allows you to check what will be the next trigger date for given notification trigger input.
 * @param trigger The schedulable notification trigger you would like to check next trigger date for (of type [`SchedulableNotificationTriggerInput`](#schedulablenotificationtriggerinput)).
 * @return If the return value is `null`, the notification won't be triggered. Otherwise, the return value is the Unix timestamp in milliseconds
 * at which the notification will be triggered.
 * @example Calculate next trigger date for a notification trigger:
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * async function logNextTriggerDate() {
 *   try {
 *     const nextTriggerDate = await Notifications.getNextTriggerDateAsync({
 *       hour: 9,
 *       minute: 0,
 *     });
 *     console.log(nextTriggerDate === null ? 'No next trigger date' : new Date(nextTriggerDate));
 *   } catch (e) {
 *     console.warn(`Couldn't have calculated next trigger date: ${e}`);
 *   }
 * }
 * ```
 * @header schedule
 */
export default async function getNextTriggerDateAsync(
  trigger: SchedulableNotificationTriggerInput
): Promise<number | null> {
  if (!NotificationScheduler.getNextTriggerDateAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'getNextTriggerDateAsync');
  }

  return await NotificationScheduler.getNextTriggerDateAsync(parseTrigger(trigger));
}
