import { BackgroundTaskExecutor, BackgroundTaskOptions, BackgroundTaskStatus } from './BackgroundTask.types';
export { BackgroundTaskStatus, BackgroundTaskInfoStatus, BackgroundTaskInfo, BackgroundTaskType, BackgroundTaskLogEntry, } from './BackgroundTask.types';
/**
 * Creates a new backgound task
 * @param taskIdentifier Identifier of the task
 * @param taskExecutor Executor for the task
 */
export declare const createTask: (taskIdentifier: string, taskExecutor: BackgroundTaskExecutor) => void;
/**
 * Schedules a registered task
 * @param taskIdentifier
 * @param options
 */
export declare const scheduleTaskAsync: (taskIdentifier: string, options: BackgroundTaskOptions) => Promise<void>;
/**
 * Cancels a scheduled task by its identifier
 *
 * @param taskIdentifier Identifier of task to cancel
 */
export declare const cancelScheduledTaskAsync: (taskIdentifier: string) => Promise<void>;
/**
 * Returns the status for the Background Task API. On web, it always returns `BackgroundTaskStatus.Restricted`,
 * while on native platforms it returns `BackgroundTaskStatus.Available`. There is
 *
 * @returns A BackgroundTaskStatus enum value or null if not available.
 */
export declare const getStatusAsync: () => Promise<BackgroundTaskStatus>;
/**
 * Checks whether the task is registered using the createTask method
 *
 * @param taskIdentifier Identifier of task to check
 */
export declare const isTaskRegisteredAsync: (taskIdentifier: string) => Promise<boolean>;
/**
 * Returns true if the task is scheduled. By is scheduled we mean that the task is scheduled to
 * run in the future.
 * @param taskIdentifier Identifier of the task to check
 * @returns True if the task is scheduled
 */
export declare const isTaskScheduled: (taskIdentifier: string) => Promise<boolean>;
/**
 * Returns task log from the task repository for a given task
 * @param taskIdentifier Identifier of the task to get log
 * @returns Task log
 */
export declare const getTaskLogItems: (taskIdentifier: string) => Promise<import("./BackgroundTask.types").BackgroundTaskLogEntry[] | undefined>;
/**
 * Returns task log from the task repository for a given task
 * @returns Task log
 */
export declare const getLogItems: () => Promise<import("./BackgroundTask.types").BackgroundTaskLogEntry[]>;
/**
 * Returns the task info from the task repository
 * @param taskIdentifier Identifier of the task to get info for
 * @returns Task info or null if not found
 */
export declare const getScheduledTaskInfo: (taskIdentifier: string) => Promise<import("./BackgroundTask.types").BackgroundTaskInfo | null | undefined>;
/**
 * Returns all task infos from the task repository
 * @returns List of Task infos
 */
export declare const getScheduledTaskInfos: () => Promise<import("./BackgroundTask.types").BackgroundTaskInfo[]>;
/**
 * Returns true/false if the background task worker is active.
 *
 * @returns True if the worker is running
 */
export declare const isWorkerRunning: () => Promise<boolean>;
/**
 * Clears up the repository of scheduled tasks with logs
 */
export declare const clearScheduledTasks: () => Promise<void>;
/**
 * Cleans up the repository of scheduled tasks with logs
 */
export declare const clearTaskLog: () => Promise<void>;
/**
 * Adds a listener for the onPerformWork event
 * @param cb Callback to be called when the event is triggered
 * @returns An unsubscribe method
 */
export declare const addOnWorkListener: (cb: () => void) => import("expo-modules-core").EventSubscription;
//# sourceMappingURL=BackgroundTask.d.ts.map