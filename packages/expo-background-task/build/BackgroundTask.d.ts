import { BackgroundTaskStatus } from './BackgroundTask.types';
/**
 * Returns the status for the Background Task API. On web, it always returns `BackgroundTaskStatus.Restricted`,
 * while on native platforms it returns `BackgroundTaskStatus.Available`. There is
 *
 * @returns A BackgroundTaskStatus enum value or null if not available.
 */
export declare const getStatusAsync: () => Promise<BackgroundTaskStatus>;
/**
 * Registers a background task with the given name. Registered tasks are saved in persistent storage and restored once the app is initialized.
 * @param taskName Name of the task to register. The task needs to be defined first - see [`TaskManager.defineTask`](taskmanager#defineTask)
 * for more details.
 * @param options An object containing the background task options.
 *
 * @example
 * ```ts
 * import * as TaskManager from 'expo-task-manager';
 *
 * // Register the task outside of the component
 * TaskManager.defineTask(YOUR_TASK_NAME, () => {
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
export declare function registerTaskAsync(taskName: string, options?: object): Promise<void>;
/**
 * Unregisters a background task, so the application will no longer be executing this task.
 * @param taskName Name of the task to unregister.
 * @return A promise which fulfils when the task is fully unregistered.
 */
export declare function unregisterTaskAsync(taskName: string): Promise<void>;
export { BackgroundTaskStatus, BackgroundTaskResult, BackgroundTaskOptions as BackgroundOptions, } from './BackgroundTask.types';
//# sourceMappingURL=BackgroundTask.d.ts.map