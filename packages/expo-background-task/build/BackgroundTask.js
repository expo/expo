import { UnavailabilityError } from 'expo-modules-core';
import * as TaskManager from 'expo-task-manager';
import ExpoBackgroundTaskModule from './ExpoBackgroundTaskModule';
// @needsAudit
/**
 * Returns the status for the Background Task API. On web, it always returns `BackgroundTaskStatus.Restricted`,
 * while on native platforms it returns `BackgroundTaskStatus.Available`. There is
 *
 * @returns A BackgroundTaskStatus enum value or null if not available.
 */
export const getStatusAsync = async () => {
    if (!ExpoBackgroundTaskModule.getStatusAsync) {
        throw new UnavailabilityError('BackgroundTask', 'getStatusAsync');
    }
    return ExpoBackgroundTaskModule.getStatusAsync();
};
// @needsAudit
/**
 * Registers background task with given name. Registered tasks are saved in persistent storage and restored once the app is initialized.
 * @param taskName Name of the task to register. The task needs to be defined first - see [`TaskManager.defineTask`](taskmanager#defineTask)
 * for more details.
 * @param options An object containing the background task options.
 *
 * @example
 * ```ts
 * import * as TaskManager from 'expo-task-manager';
 *
 * TaskManager.defineTask(YOUR_TASK_NAME, () => {
 *   try {
 *     // TODO
 *   } catch (error) {
 *   }
 * });
 * ```
 */
export async function registerTaskAsync(taskName, options = {}) {
    if (!ExpoBackgroundTaskModule.registerTaskAsync) {
        throw new UnavailabilityError('BackgroundTask', 'registerTaskAsync');
    }
    if (!TaskManager.isTaskDefined(taskName)) {
        throw new Error(`Task '${taskName}' is not defined. You must define a task using TaskManager.defineTask before registering.`);
    }
    console.log('ExpoBackgroundTaskModule.registerTaskAsync', ExpoBackgroundTaskModule.registerTaskAsync, { taskName, options });
    await ExpoBackgroundTaskModule.registerTaskAsync(taskName, options);
}
// @needsAudit
/**
 * Unregisters background task, so the application will no longer be executing this task.
 * @param taskName Name of the task to unregister.
 * @return A promise which fulfils when the task is fully unregistered.
 */
export async function unregisterTaskAsync(taskName) {
    if (!ExpoBackgroundTaskModule.unregisterTaskAsync) {
        throw new UnavailabilityError('BackgroundTask', 'unregisterTaskAsync');
    }
    console.log('ExpoBackgroundTaskModule.unregisterTaskAsync', ExpoBackgroundTaskModule.unregisterTaskAsync);
    await ExpoBackgroundTaskModule.unregisterTaskAsync(taskName);
}
// Export types
export { BackgroundTaskStatus, BackgroundTaskResult } from './BackgroundTask.types';
//# sourceMappingURL=BackgroundTask.js.map