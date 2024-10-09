import { BackgroundTaskOptions, BackgroundTaskRunInfo } from './BackgroundTask.types';
/**
 * When creating a new task, we need to save the task info to the database.
 * @param taskIdentifier Identifier of the task
 * @param options Options for the task
 * */
export declare const cleanRepository: () => Promise<void>;
/**
 * When creating a new task, we need to save the task info to the database.
 * @param taskIdentifier Identifier of the task
 * @param options Options for the task
 * */
export declare const createTaskInfo: (taskIdentifier: string, options: BackgroundTaskOptions) => Promise<number>;
/**
 * Logs task info to the task repository
 * @param taskIdentifier Identifier to log
 * @param taskRunInfo Task run info to log
 */
export declare const addTaskInfoLog: (taskIdentifier: string, taskRunInfo: BackgroundTaskRunInfo) => Promise<void>;
/**
 * Returns the log for a task from the task repository
 * @param taskIdentifier
 * @returns Task run info log
 */
export declare const getTaskInfoLog: (taskIdentifier: string) => Promise<BackgroundTaskRunInfo[]>;
/**
 * Cancels a scheduled task by its identifier
 * @param taskIdentifier Identifier of task to cancel
 * @returns Number of tasks left in the list
 */
export declare const deleteTaskInfo: (taskIdentifier: string) => Promise<number>;
/**
 * Returns task info from the task repository
 * @param taskIdentifier Identifier of the task to get info for
 * @returns Task info or null if not found
 */
export declare const getTaskInfo: (taskIdentifier: string) => Promise<any>;
/**
 * Returns all task identifiers stored in the task repository. This includes all tasks that are
 * scheduled to run or have been run for one-time tasks.
 */
export declare const getTaskIdentifiers: () => Promise<string[]>;
//# sourceMappingURL=BackgroundTaskRepository.d.ts.map