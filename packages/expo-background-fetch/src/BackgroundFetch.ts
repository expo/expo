import { isRunningInExpoGo } from 'expo';
import { Platform, UnavailabilityError } from 'expo-modules-core';
import * as TaskManager from 'expo-task-manager';

import {
  BackgroundFetchOptions,
  BackgroundFetchResult,
  BackgroundFetchStatus,
} from './BackgroundFetch.types';
import ExpoBackgroundFetch from './ExpoBackgroundFetch';

let didShowDeprecationWarning = false;

const showDeprecationWarning = () => {
  if (!didShowDeprecationWarning) {
    didShowDeprecationWarning = true;
    console.warn(
      'expo-background-fetch: This library is deprecated. Use expo-background-task instead.'
    );
  }
};

let warnedAboutExpoGo = false;

function _validate(taskName: unknown) {
  if (isRunningInExpoGo()) {
    if (!warnedAboutExpoGo) {
      const message =
        '`Background Fetch` functionality is not available in Expo Go:\n' +
        'Please use a development build to avoid limitations. Learn more: https://expo.fyi/dev-client.';
      console.warn(message);
      warnedAboutExpoGo = true;
    }
  }
  if (!taskName || typeof taskName !== 'string') {
    throw new TypeError('`taskName` must be a non-empty string.');
  }
}

// @needsAudit
/**
 * Gets a status of background fetch.
 * @return Returns a promise which fulfils with one of `BackgroundFetchStatus` enum values.
 * @deprecated Use [`getStatusAsync()`](./background-task/#backgroundtaskgetstatusasync) from `expo-background-task`
 * instead. The `expo-background-fetch` package has been deprecated.
 */
export async function getStatusAsync(): Promise<BackgroundFetchStatus | null> {
  showDeprecationWarning();

  if (Platform.OS === 'android') {
    return BackgroundFetchStatus.Available;
  }
  return ExpoBackgroundFetch.getStatusAsync();
}

// @needsAudit
/**
 * Sets the minimum number of seconds that must elapse before another background fetch can be
 * initiated. This value is advisory only and does not indicate the exact amount of time expected
 * between fetch operations.
 *
 * > This method doesn't take any effect on Android. It is a global value which means that it can
 * overwrite settings from another application opened through Expo Go.
 *
 * @param minimumInterval Number of seconds that must elapse before another background fetch can be called.
 * @return A promise which fulfils once the minimum interval is set.
 * @deprecated Use the [`registerTaskAsync()`](./background-task#backgroundtaskregistertaskasynctaskname-options) method
 * from expo-background-task package, and specify [`BackgroundTaskOptions`](./background-task/#backgroundtaskoptions)
 * argument instead, when setting task interval time.
 */
export async function setMinimumIntervalAsync(minimumInterval: number): Promise<void> {
  showDeprecationWarning();

  if (!ExpoBackgroundFetch.setMinimumIntervalAsync) {
    return;
  }
  // iOS only
  await ExpoBackgroundFetch.setMinimumIntervalAsync(minimumInterval);
}

// @needsAudit
/**
 * Registers background fetch task with given name. Registered tasks are saved in persistent storage and restored once the app is initialized.
 * @param taskName Name of the task to register. The task needs to be defined first - see [`TaskManager.defineTask`](task-manager/#taskmanagerdefinetaskttaskname-taskexecutor)
 * for more details.
 * @param options An object containing the background fetch options.
 *
 * @example
 * ```ts
 * import * as BackgroundFetch from 'expo-background-fetch';
 * import * as TaskManager from 'expo-task-manager';
 *
 * TaskManager.defineTask(YOUR_TASK_NAME, () => {
 *   try {
 *     const receivedNewData = // do your background fetch here
 *     return receivedNewData ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData;
 *   } catch (error) {
 *     return BackgroundFetch.BackgroundFetchResult.Failed;
 *   }
 * });
 * ```
 * @deprecated Use [`registerTaskAsync()`](./background-task#backgroundtaskregistertaskasynctaskname-options) from `expo-background-task`
 * instead. The `expo-background-fetch` package has been deprecated.
 */
export async function registerTaskAsync(
  taskName: string,
  options: BackgroundFetchOptions = {}
): Promise<void> {
  showDeprecationWarning();

  if (!ExpoBackgroundFetch.registerTaskAsync) {
    throw new UnavailabilityError('BackgroundFetch', 'registerTaskAsync');
  }
  if (!TaskManager.isTaskDefined(taskName)) {
    throw new Error(
      `Task '${taskName}' is not defined. You must define a task using TaskManager.defineTask before registering.`
    );
  }
  _validate(taskName);
  await ExpoBackgroundFetch.registerTaskAsync(taskName, options);
}

// @needsAudit
/**
 * Unregisters background fetch task, so the application will no longer be executing this task.
 * @param taskName Name of the task to unregister.
 * @return A promise which fulfils when the task is fully unregistered.
 * @deprecated Use [`unregisterTaskAsync()`](./background-task/#backgroundtaskunregistertaskasynctaskname) from `expo-background-task`
 * instead. The `expo-background-fetch` package has been deprecated.
 */
export async function unregisterTaskAsync(taskName: string): Promise<void> {
  showDeprecationWarning();

  if (!ExpoBackgroundFetch.unregisterTaskAsync) {
    throw new UnavailabilityError('BackgroundFetch', 'unregisterTaskAsync');
  }
  _validate(taskName);
  await ExpoBackgroundFetch.unregisterTaskAsync(taskName);
}

export { BackgroundFetchResult, BackgroundFetchStatus, BackgroundFetchOptions };
