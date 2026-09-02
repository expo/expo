import { isRunningInExpoGo, Platform, UnavailabilityError } from 'expo';
import * as TaskManager from 'expo-task-manager';

import type { BackgroundTaskOptions } from './BackgroundTask.types';
import { BackgroundTaskStatus } from './BackgroundTask.types';
import ExpoBackgroundTaskModule from './ExpoBackgroundTaskModule';

// Flag to warn only once about a restricted environment (an Apple simulator, or a device policy)
let warnedAboutRestrictedStatus = false;

let warnedAboutExpoGo = false;

function _validate(taskName: unknown) {
  if (isRunningInExpoGo()) {
    if (!warnedAboutExpoGo) {
      const message =
        '`Background Task` functionality is not available in Expo Go:\n' +
        'You can use this API and any others in a development build. Learn more: https://expo.fyi/dev-client.';
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
 * Returns the status for the Background Task API.
 *
 * On iOS this reflects the system **Background App Refresh** setting: `BackgroundTaskStatus.Available`
 * when it is on, `BackgroundTaskStatus.Denied` when the user has turned it off for this app or for
 * the whole system, and `BackgroundTaskStatus.Restricted` when a device policy forbids background
 * activity or the app is running on a simulator. On Android it always returns
 * `BackgroundTaskStatus.Available`, and on web `BackgroundTaskStatus.Restricted`.
 *
 * Because there is more than one way for background tasks to be unavailable, test for
 * `BackgroundTaskStatus.Available` rather than comparing against a single unavailable value.
 *
 * @returns A BackgroundTaskStatus enum value.
 */
export const getStatusAsync = async (): Promise<BackgroundTaskStatus> => {
  if (!ExpoBackgroundTaskModule.getStatusAsync) {
    throw new UnavailabilityError('BackgroundTask', 'getStatusAsync');
  }

  return isRunningInExpoGo()
    ? BackgroundTaskStatus.Restricted
    : ExpoBackgroundTaskModule.getStatusAsync();
};

// @needsAudit
/**
 * Registers a background task with the given name. Registered tasks are saved in persistent storage and restored once the app is initialized.
 * @param taskName Name of the task to register. The task needs to be defined first - see [`TaskManager.defineTask`](task-manager/#taskmanagerdefinetasktaskname-taskexecutor)
 * for more details.
 * @param options An object containing the background task options.
 *
 * @example
 * ```ts
 * import * as TaskManager from 'expo-task-manager';
 *
 * // Register the task outside of the component
 * TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
 *   try {
 *     await AsyncStorage.setItem(LAST_TASK_DATE_KEY, Date.now().toString());
 *   } catch (error) {
 *     console.error('Failed to save the last fetch date', error);
 *     return BackgroundTaskResult.Failed;
 *   }
 *   return BackgroundTaskResult.Success;
 * });
 * ```
 *
 * You can now use the `registerTaskAsync` function to register the task:
 *
 * ```ts
 * BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {});
 * ```
 */
export async function registerTaskAsync(
  taskName: string,
  options: BackgroundTaskOptions = {}
): Promise<void> {
  if (!ExpoBackgroundTaskModule.registerTaskAsync) {
    throw new UnavailabilityError('BackgroundTask', 'registerTaskAsync');
  }
  if (!TaskManager.isTaskDefined(taskName)) {
    throw new Error(
      `Task '${taskName}' is not defined. You must define a task using TaskManager.defineTask before registering.`
    );
  }

  // Only `Restricted` skips registration, because nothing the user does can lift it. `Denied`
  // deliberately falls through and registers the task: the user can turn Background App Refresh
  // back on at any moment, and a task that was never registered would not start running when
  // they do.
  if ((await ExpoBackgroundTaskModule.getStatusAsync()) === BackgroundTaskStatus.Restricted) {
    if (!warnedAboutRestrictedStatus) {
      const message =
        Platform.OS === 'ios'
          ? `Background tasks are restricted on this device — they are unsupported on iOS simulators, and a device policy such as parental controls or MDM can forbid them. Skipped registering task: ${taskName}.`
          : `Background tasks are not available in the current environment. Skipped registering task: ${taskName}.`;
      console.warn(message);
      warnedAboutRestrictedStatus = true;
    }
    return;
  }
  _validate(taskName);
  if (await TaskManager.isTaskRegisteredAsync(taskName)) {
    return;
  }
  await ExpoBackgroundTaskModule.registerTaskAsync(taskName, options);
}

// @needsAudit
/**
 * Unregisters a background task, so the application will no longer be executing this task.
 * @param taskName Name of the task to unregister.
 * @return A promise which fulfils when the task is fully unregistered.
 */
export async function unregisterTaskAsync(taskName: string): Promise<void> {
  if (!ExpoBackgroundTaskModule.unregisterTaskAsync) {
    throw new UnavailabilityError('BackgroundTask', 'unregisterTaskAsync');
  }
  _validate(taskName);
  if (!(await TaskManager.isTaskRegisteredAsync(taskName))) {
    return;
  }
  await ExpoBackgroundTaskModule.unregisterTaskAsync(taskName);
}

// @needsAudit
/**
 * When in debug mode this function will trigger running the background tasks.
 * This function will only work for apps built in debug mode.
 * This method is only available in development mode. It will not work in production builds.
 * @returns A promise which fulfils when the task is triggered.
 */
export async function triggerTaskWorkerForTestingAsync(): Promise<boolean> {
  if (__DEV__) {
    if (!ExpoBackgroundTaskModule.triggerTaskWorkerForTestingAsync) {
      throw new UnavailabilityError('BackgroundTask', 'triggerTaskWorkerForTestingAsync');
    }
    console.log('Calling triggerTaskWorkerForTestingAsync');
    return await ExpoBackgroundTaskModule.triggerTaskWorkerForTestingAsync();
  } else {
    return Promise.resolve(false);
  }
}

// @needsAudit
/**
 * Adds a listener that is called when the background executor expires. On iOS, tasks can run
 * for minutes, but the system can interrupt the process at any time. This listener is called
 * when the system decides to stop the background tasks and should be used to clean up resources
 * or save state. When the expiry handler is called, the main task runner is rescheduled automatically.
 * @platform ios
 * @return An object with a `remove` method to unsubscribe the listener.
 */
export function addExpirationListener(listener: () => void): { remove: () => void } {
  if (!ExpoBackgroundTaskModule.addListener) {
    throw new UnavailabilityError('BackgroundTask', 'addListener');
  }
  return ExpoBackgroundTaskModule.addListener('onTasksExpired', listener);
}

// Export types
export {
  BackgroundTaskStatus,
  BackgroundTaskResult,
  type BackgroundTaskOptions,
} from './BackgroundTask.types';
