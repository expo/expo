import { BackgroundTaskInfo, BackgroundTaskOptions, BackgroundTaskLogEntry } from './BackgroundTask.types';
/**
 * Removes all tasks from the task repository
 * */
export declare const clearScheduledTasks: () => Promise<void>;
/**
 * Removes all task log items from the task repository
 * */
export declare const clearTaksLog: () => Promise<void>;
/**
 * When creating a new task, we need to save the task info to the database.
 * @param taskIdentifier Identifier of the task
 * @param options Options for the task
 * */
export declare const createScheduledTaskInfo: (taskIdentifier: string, options: BackgroundTaskOptions) => Promise<BackgroundTaskInfo>;
/**
 * Returns all task infos from the task repository
 * @returns List of task infos
 */
export declare const getScheduledTaskInfos: () => Promise<BackgroundTaskInfo[]>;
export declare const getScheduledTaskInfo: (taskIdentifier: string) => Promise<BackgroundTaskInfo | null>;
/**
 * Cancels a scheduled task by its identifier
 * @param taskIdentifier Identifier of task to cancel
 * @returns Deleted item(s)
 */
export declare const deleteScheduledTaskInfo: (taskIdentifier: string) => Promise<BackgroundTaskInfo[]>;
/**
 * Logs task info to the task repository
 * @param taskRunInfo Task run info to log
 */
export declare const addLogItem: (taskRunInfo: BackgroundTaskLogEntry) => Promise<void>;
/**
 * Returns the log for all tasks from the task repository
 * @returns Task run info log
 */
export declare const getLogItems: () => Promise<BackgroundTaskLogEntry[]>;
//# sourceMappingURL=BackgroundTaskRepository.d.ts.map