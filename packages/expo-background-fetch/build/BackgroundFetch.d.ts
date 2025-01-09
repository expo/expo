import { BackgroundFetchOptions, BackgroundFetchResult, BackgroundFetchStatus } from './BackgroundFetch.types';
/**
 * Gets a status of background fetch.
 * @return Returns a promise which fulfils with one of `BackgroundFetchStatus` enum values.
 */
export declare function getStatusAsync(): Promise<BackgroundFetchStatus | null>;
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
 */
export declare function setMinimumIntervalAsync(minimumInterval: number): Promise<void>;
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
 */
export declare function registerTaskAsync(taskName: string, options?: BackgroundFetchOptions): Promise<void>;
/**
 * Unregisters background fetch task, so the application will no longer be executing this task.
 * @param taskName Name of the task to unregister.
 * @return A promise which fulfils when the task is fully unregistered.
 */
export declare function unregisterTaskAsync(taskName: string): Promise<void>;
export { BackgroundFetchResult, BackgroundFetchStatus, BackgroundFetchOptions };
//# sourceMappingURL=BackgroundFetch.d.ts.map