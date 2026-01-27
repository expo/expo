import { UnavailabilityError } from 'expo-modules-core';

import BackgroundNotificationTasksModule from './BackgroundNotificationTasksModule';

/**
 * Call `registerTaskAsync` to set a callback (task) that runs when a notification is received while the app is in foreground, background, or terminated.
 * Only on Android, the task also runs in response to a notification action tap when the app is backgrounded or terminated.
 * When the app is terminated, only a [Headless Background Notification](/push-notifications/what-you-need-to-know/#headless-background-notifications) triggers the task execution.
 * However, the OS may decide not to deliver the notification to your app in some cases (e.g. when the device is in Doze mode on Android, or when you send too many notifications - Apple recommends to not ["send more than two or three per hour"](https://developer.apple.com/documentation/usernotifications/pushing-background-updates-to-your-app#overview)).
 *
 * Under the hood, this function is run using `expo-task-manager`. You **must** define the task first, with [`TaskManager.defineTask`](./task-manager#taskmanagerdefinetasktaskname-taskexecutor) and register it with `registerTaskAsync`.
 *
 * Make sure you define and register the task in the module scope of a JS module which is required early by your app (e.g. in the `index.ts` file) - see this [example](https://github.com/expo/expo/blob/main/apps/notification-tester/index.ts#L2).
 * `expo-task-manager` loads your app's JS bundle in the background and executes the task, as well as any side effects which may happen as a consequence of requiring any JS modules.
 *
 * The callback function you define with `TaskManager.defineTask` receives an object with the following fields:
 * - `data`: The remote payload delivered by either FCM (Android) or APNs (iOS). See [`NotificationTaskPayload`](#notificationtaskpayload) for details.
 * - `executionInfo`: JSON object of additional info related to the task, including the `taskName`.
 * - `error`: This field should always be undefined with a push-notification task.
 *
 * From the callback function, you may return a [`BackgroundNotificationResult`](#backgroundnotificationresult) value to indicate the result of a background fetch operation on iOS.
 *
 * Be advised that console.log statements may not be appropriate for debugging background tasks, as the output may not be visible depending on the platform and app state.
 *
 * @param taskName The string you passed to `TaskManager.defineTask` as the `taskName` parameter.
 *
 * @example
 * ```ts
 * import * as TaskManager from 'expo-task-manager';
 * import * as Notifications from 'expo-notifications';
 *
 * const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';
 *
 * TaskManager.defineTask<Notifications.NotificationTaskPayload>(BACKGROUND_NOTIFICATION_TASK, ({ data, executionInfo, error }) => {
 *   console.log('Received a notification task payload!');
 *   const isNotificationResponse = 'actionIdentifier' in data;
 *   if (isNotificationResponse) {
 *     // Do something with the notification response from user
 *   } else {
 *     // Do something with the data from notification that was received
 *   }
 *   return BackgroundNotificationResult.NoData
 * });
 *
 * Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
 * ```
 * @header inBackground
 */
export async function registerTaskAsync(taskName: string): Promise<null> {
  if (!BackgroundNotificationTasksModule.registerTaskAsync) {
    throw new UnavailabilityError('Notifications', 'registerTaskAsync');
  }

  return await BackgroundNotificationTasksModule.registerTaskAsync(taskName);
}

/*
 * Constants that indicate the result of a background fetch operation.
 * Corresponds to [`UIBackgroundFetchResult`](https://developer.apple.com/documentation/uikit/uibackgroundfetchresult).
 * @platform ios
 */
export enum BackgroundNotificationTaskResult {
  NewData = 0,
  NoData = 1,
  Failed = 2,
}
