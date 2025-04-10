import { UnavailabilityError } from 'expo-modules-core';
import BackgroundNotificationTasksModule from './BackgroundNotificationTasksModule';
/**
 * Call `registerTaskAsync` to set a callback (task) that will run in response to when a notification is received while the app is in foreground, background, or terminated.
 * When app is terminated, only a [data message](https://firebase.google.com/docs/cloud-messaging/concept-options#data_messages) (Android) / [background notification](https://developer.apple.com/documentation/usernotifications/pushing-background-updates-to-your-app#Create-a-background-notification) (iOS) triggers the task execution.
 * However, the OS may decide not to deliver the notification to your app in some cases (e.g. when the device is in Doze mode on Android, or when you send too many notifications - Apple recommends to not ["send more than two or three per hour"](https://developer.apple.com/documentation/usernotifications/pushing-background-updates-to-your-app#overview)).
 *
 * Under the hood, this function is run using `expo-task-manager`. You **must** define the task first, with [`TaskManager.defineTask`](./task-manager#taskmanagerdefinetasktaskname-taskexecutor) and register it with `registerTaskAsync`.
 *
 * Make sure you define and register the task in the module scope of a JS module which is required early by your app (e.g. in the `index.js` file).
 * `expo-task-manager` loads your app's JS bundle in the background and executes the task, as well as any side effects which may happen as a consequence of requiring any JS modules.
 *
 * The callback function you define with `TaskManager.defineTask` receives an object with the following fields:
 * - `data`: The remote payload delivered by either FCM (Android) or APNs (iOS). See [`PushNotificationTrigger`](#pushnotificationtrigger) for details.
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