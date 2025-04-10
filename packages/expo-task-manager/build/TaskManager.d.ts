/**
 * Error object that can be received through [`TaskManagerTaskBody`](#taskmanagertaskbody) when the
 * task fails.
 */
export interface TaskManagerError {
    code: string | number;
    message: string;
}
/**
 * Represents the object that is passed to the task executor.
 */
export interface TaskManagerTaskBody<T = unknown> {
    /**
     * An object of data passed to the task executor. Its properties depend on the type of the task.
     */
    data: T;
    /**
     * Error object if the task failed or `null` otherwise.
     */
    error: TaskManagerError | null;
    /**
     * Additional details containing unique ID of task event and name of the task.
     */
    executionInfo: TaskManagerTaskBodyExecutionInfo;
}
/**
 * Additional details about execution provided in `TaskManagerTaskBody`.
 */
export interface TaskManagerTaskBodyExecutionInfo {
    /**
     * State of the application.
     * @platform ios
     */
    appState?: 'active' | 'background' | 'inactive';
    /**
     * Unique ID of task event.
     */
    eventId: string;
    /**
     * Name of the task.
     */
    taskName: string;
}
/**
 * Represents an already registered task.
 */
export interface TaskManagerTask {
    /**
     * Name that the task is registered with.
     */
    taskName: string;
    /**
     * Type of the task which depends on how the task was registered.
     */
    taskType: string;
    /**
     * Provides `options` that the task was registered with.
     */
    options: any;
}
/**
 * @deprecated Use `TaskManagerTask` instead.
 * @hidden
 */
export interface RegisteredTask extends TaskManagerTask {
}
/**
 * Type of task executor – a function that handles the task.
 */
export type TaskManagerTaskExecutor<T = any> = (body: TaskManagerTaskBody<T>) => Promise<any>;
/**
 * Defines task function. It must be called in the global scope of your JavaScript bundle.
 * In particular, it cannot be called in any of React lifecycle methods like `componentDidMount`.
 * This limitation is due to the fact that when the application is launched in the background,
 * we need to spin up your JavaScript app, run your task and then shut down — no views are mounted
 * in this scenario.
 *
 * @param taskName Name of the task. It must be the same as the name you provided when registering the task.
 * @param taskExecutor A function that will be invoked when the task with given `taskName` is executed.
 */
export declare function defineTask<T = unknown>(taskName: string, taskExecutor: TaskManagerTaskExecutor<T>): void;
/**
 * Checks whether the task is already defined.
 *
 * @param taskName Name of the task.
 */
export declare function isTaskDefined(taskName: string): boolean;
/**
 * Determine whether the task is registered. Registered tasks are stored in a persistent storage and
 * preserved between sessions.
 *
 * @param taskName Name of the task.
 * @returns A promise which resolves to `true` if a task with the given name is registered, otherwise `false`.
 */
export declare function isTaskRegisteredAsync(taskName: string): Promise<boolean>;
/**
 * Retrieves `options` associated with the task, that were passed to the function registering the task
 * (e.g. `Location.startLocationUpdatesAsync`).
 *
 * @param taskName Name of the task.
 * @return A promise which fulfills with the `options` object that was passed while registering task
 * with given name or `null` if task couldn't be found.
 */
export declare function getTaskOptionsAsync<TaskOptions>(taskName: string): Promise<TaskOptions>;
/**
 * Provides information about tasks registered in the app.
 *
 * @returns A promise which fulfills with an array of tasks registered in the app.
 * @example
 * ```js
 * [
 *   {
 *     taskName: 'location-updates-task-name',
 *     taskType: 'location',
 *     options: {
 *       accuracy: Location.Accuracy.High,
 *       showsBackgroundLocationIndicator: false,
 *     },
 *   },
 *   {
 *     taskName: 'geofencing-task-name',
 *     taskType: 'geofencing',
 *     options: {
 *       regions: [...],
 *     },
 *   },
 * ]
 * ```
 */
export declare function getRegisteredTasksAsync(): Promise<TaskManagerTask[]>;
/**
 * Unregisters task from the app, so the app will not be receiving updates for that task anymore.
 * _It is recommended to use methods specialized by modules that registered the task, eg.
 * [`Location.stopLocationUpdatesAsync`](./location/#expolocationstoplocationupdatesasynctaskname)._
 *
 * @param taskName Name of the task to unregister.
 * @return A promise which fulfills as soon as the task is unregistered.
 */
export declare function unregisterTaskAsync(taskName: string): Promise<void>;
/**
 * Unregisters all tasks registered for the running app. You may want to call this when the user is
 * signing out and you no longer need to track his location or run any other background tasks.
 * @return A promise which fulfills as soon as all tasks are completely unregistered.
 */
export declare function unregisterAllTasksAsync(): Promise<void>;
/**
 * Determine if the `TaskManager` API can be used in this app.
 * @return A promise which fulfills with `true` if the API can be used, and `false` otherwise.
 * With Expo Go, `TaskManager` is not available on Android, and does not support background execution on iOS.
 * Use a development build to avoid limitations: https://expo.fyi/dev-client.
 * On the web, it always returns `false`.
 */
export declare function isAvailableAsync(): Promise<boolean>;
//# sourceMappingURL=TaskManager.d.ts.map