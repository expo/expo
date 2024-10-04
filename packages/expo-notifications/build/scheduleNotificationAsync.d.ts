import { NotificationTriggerInput as NativeNotificationTriggerInput } from './NotificationScheduler.types';
import { NotificationRequestInput, NotificationTriggerInput } from './Notifications.types';
/**
 * Schedules a notification to be triggered in the future.
 * > **Note:** Please note that this does not mean that the notification will be presented when it is triggered.
 * For the notification to be presented you have to set a notification handler with [`setNotificationHandler`](#notificationssetnotificationhandlerhandler)
 * that will return an appropriate notification behavior. For more information see the example below.
 * @param request An object describing the notification to be triggered.
 * @return Returns a Promise resolving to a string which is a notification identifier you can later use to cancel the notification or to identify an incoming notification.
 * @example
 * # Schedule the notification that will trigger once, in one minute from now
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * Notifications.scheduleNotificationAsync({
 *   content: {
 *     title: "Time's up!",
 *     body: 'Change sides!',
 *   },
 *   trigger: {
 *     seconds: 60,
 *   },
 * });
 * ```
 *
 * # Schedule the notification that will trigger repeatedly, every 20 minutes
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * Notifications.scheduleNotificationAsync({
 *   content: {
 *     title: 'Remember to drink water!',
 *   },
 *   trigger: {
 *     seconds: 60 * 20,
 *     repeats: true,
 *   },
 * });
 * ```
 *
 * # Schedule the notification that will trigger once, at the beginning of next hour
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * const trigger = new Date(Date.now() + 60 * 60 * 1000);
 * trigger.setMinutes(0);
 * trigger.setSeconds(0);
 *
 * Notifications.scheduleNotificationAsync({
 *   content: {
 *     title: 'Happy new hour!',
 *   },
 *   trigger,
 * });
 * ```
 * @header schedule
 */
export default function scheduleNotificationAsync(request: NotificationRequestInput): Promise<string>;
export declare function parseTrigger(userFacingTrigger: NotificationTriggerInput): NativeNotificationTriggerInput;
//# sourceMappingURL=scheduleNotificationAsync.d.ts.map