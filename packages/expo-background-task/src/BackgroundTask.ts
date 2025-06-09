import { isRunningInExpoGo } from 'expo';
import { Platform, UnavailabilityError } from 'expo-modules-core';
import * as TaskManager from 'expo-task-manager';

import { BackgroundTaskOptions, BackgroundTaskStatus } from './BackgroundTask.types';
import ExpoBackgroundTaskModule from './ExpoBackgroundTaskModule';

// Flag to warn about running on Apple simulator
let warnAboutRunningOniOSSimulator = false;

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
 * Returns the status for the Background Task API. On web, it always returns `BackgroundTaskStatus.Restricted`,
 * while on native platforms it returns `BackgroundTaskStatus.Available`.
 *
 * @returns A BackgroundTaskStatus enum value or `null` if not available.
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
 * TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, () => {
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

  if ((await ExpoBackgroundTaskModule.getStatusAsync()) === BackgroundTaskStatus.Restricted) {
    if (!warnAboutRunningOniOSSimulator) {
      const message =
        Platform.OS === 'ios'
          ? `Background tasks are not supported on iOS simulators. Skipped registering task: ${taskName}.`
          : `Background tasks are not available in the current environment. Skipped registering task: ${taskName}.`;
      console.warn(message);
      warnAboutRunningOniOSSimulator = true;
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

// Export types
export {
  BackgroundTaskStatus,
  BackgroundTaskResult,
  BackgroundTaskOptions,
} from './BackgroundTask.types';
