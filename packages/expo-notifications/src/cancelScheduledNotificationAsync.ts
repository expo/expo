import { UnavailabilityError } from 'expo-modules-core';

import NotificationScheduler from './NotificationScheduler';

/**
 * Cancels a single scheduled notification. The scheduled notification of given ID will not trigger.
 * @param identifier The notification identifier with which `scheduleNotificationAsync` method resolved when the notification has been scheduled.
 * @return A Promise resolves once the scheduled notification is successfully canceled or if there is no scheduled notification for a given identifier.
 * @example Schedule and then cancel the notification:
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * async function scheduleAndCancel() {
 *   const identifier = await Notifications.scheduleNotificationAsync({
 *     content: {
 *       title: 'Hey!',
 *     },
 *     trigger: { seconds: 60, repeats: true },
 *   });
 *   await Notifications.cancelScheduledNotificationAsync(identifier);
 * }
 * ```
 * @header schedule
 */
export default async function cancelScheduledNotificationAsync(identifier: string): Promise<void> {
  if (!NotificationScheduler.cancelScheduledNotificationAsync) {
    throw new UnavailabilityError('Notifications', 'cancelScheduledNotificationAsync');
  }

  return await NotificationScheduler.cancelScheduledNotificationAsync(identifier);
}
