import { UnavailabilityError } from 'expo-modules-core';
import BackgroundNotificationTasksModule from './BackgroundNotificationTasksModule.native';
/**
 * When a notification is received while the app is backgrounded, using this function you can set a callback that will be run in response to that notification.
 * Under the hood, this function is run using `expo-task-manager`. You **must** define the task first, with [`TaskManager.defineTask`](/task-manager#taskmanagerdefinetasktaskname-taskexecutor).
 * Make sure you define it in the global scope.
 *
 * The callback function you define with `TaskManager.defineTask` will receive an object with the following fields:
 * - `data`: The remote payload delivered by either FCM (Android) or APNs (iOS). [See here for details](#pushnotificationtrigger).
 * - `error`: The error (if any) that occurred during execution of the task.
 * - `executionInfo`: JSON object of additional info related to the task, including the `taskName`.
 * @param taskName The string you passed to `TaskManager.defineTask` as the `taskName` parameter.
 *
 * @example
 * ```ts
 * import * as TaskManager from 'expo-task-manager';
 * import * as Notifications from 'expo-notifications';
 *
 * const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';
 *
 * TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error, executionInfo }) => {
 *   console.log('Received a notification in the background!');
 *   // Do something with the notification data
 * });
 *
 * Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
 * ```
 * @header inBackground
 */
export default async function registerTaskAsync(taskName) {
    if (!BackgroundNotificationTasksModule.registerTaskAsync) {
        throw new UnavailabilityError('Notifications', 'registerTaskAsync');
    }
    return await BackgroundNotificationTasksModule.registerTaskAsync(taskName);
}
//# sourceMappingURL=registerTaskAsync.js.map