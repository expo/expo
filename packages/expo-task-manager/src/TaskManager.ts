import { EventEmitter, UnavailabilityError } from 'expo-modules-core';

import ExpoTaskManager from './ExpoTaskManager';

// @needsAudit @docsMissing
/**
 * Error object that can be received through [`TaskManagerTaskBody`](#taskmanagertaskbody) when the
 * task fails.
 */
export interface TaskManagerError {
  code: string | number;
  message: string;
}

// @needsAudit
/**
 * Represents the object that is passed to the task executor.
 */
export interface TaskManagerTaskBody<T = unknown> {
  /**
   * An object of data passed to the task executor. Its properties depends on the type of the task.
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

// @needsAudit
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

// @needsAudit
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
export interface RegisteredTask extends TaskManagerTask {}

// @needsAudit
/**
 * Type of task executor – a function that handles the task.
 */
export type TaskManagerTaskExecutor<T = unknown> = (body: TaskManagerTaskBody<T>) => void;

const tasks: Map<string, TaskManagerTaskExecutor<any>> = new Map<
  string,
  TaskManagerTaskExecutor<any>
>();

function _validateTaskName(taskName) {
  if (!taskName || typeof taskName !== 'string') {
    throw new TypeError('`taskName` must be a non-empty string.');
  }
}

// @needsAudit
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
export function defineTask<T = unknown>(
  taskName: string,
  taskExecutor: TaskManagerTaskExecutor<T>
) {
  if (!taskName || typeof taskName !== 'string') {
    console.warn(`TaskManager.defineTask: 'taskName' argument must be a non-empty string.`);
    return;
  }
  if (!taskExecutor || typeof taskExecutor !== 'function') {
    console.warn(`TaskManager.defineTask: 'task' argument must be a function.`);
    return;
  }
  tasks.set(taskName, taskExecutor);
}

// @needsAudit
/**
 * Checks whether the task is already defined.
 *
 * @param taskName Name of the task.
 */
export function isTaskDefined(taskName: string): boolean {
  return tasks.has(taskName);
}

// @needsAudit
/**
 * Determine whether the task is registered. Registered tasks are stored in a persistent storage and
 * preserved between sessions.
 *
 * @param taskName Name of the task.
 * @returns A promise which fulfills with a `boolean` value whether or not the task with given name
 * is already registered.
 */
export async function isTaskRegisteredAsync(taskName: string): Promise<boolean> {
  if (!ExpoTaskManager.isTaskRegisteredAsync) {
    throw new UnavailabilityError('TaskManager', 'isTaskRegisteredAsync');
  }

  _validateTaskName(taskName);
  return ExpoTaskManager.isTaskRegisteredAsync(taskName);
}

// @needsAudit
/**
 * Retrieves `options` associated with the task, that were passed to the function registering the task
 * (eg. `Location.startLocationUpdatesAsync`).
 *
 * @param taskName Name of the task.
 * @return A promise which fulfills with the `options` object that was passed while registering task
 * with given name or `null` if task couldn't be found.
 */
export async function getTaskOptionsAsync<TaskOptions>(taskName: string): Promise<TaskOptions> {
  if (!ExpoTaskManager.getTaskOptionsAsync) {
    throw new UnavailabilityError('TaskManager', 'getTaskOptionsAsync');
  }

  _validateTaskName(taskName);
  return ExpoTaskManager.getTaskOptionsAsync(taskName);
}

// @needsAudit
/**
 * Provides information about tasks registered in the app.
 *
 * @returns A promise which fulfills with an array of tasks registered in the app. Example:
 * ```json
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
export async function getRegisteredTasksAsync(): Promise<TaskManagerTask[]> {
  if (!ExpoTaskManager.getRegisteredTasksAsync) {
    throw new UnavailabilityError('TaskManager', 'getRegisteredTasksAsync');
  }

  return ExpoTaskManager.getRegisteredTasksAsync();
}

// @needsAudit
/**
 * Unregisters task from the app, so the app will not be receiving updates for that task anymore.
 * _It is recommended to use methods specialized by modules that registered the task, eg.
 * [`Location.stopLocationUpdatesAsync`](./location/#expolocationstoplocationupdatesasynctaskname)._
 *
 * @param taskName Name of the task to unregister.
 * @return A promise which fulfills as soon as the task is unregistered.
 */
export async function unregisterTaskAsync(taskName: string): Promise<void> {
  if (!ExpoTaskManager.unregisterTaskAsync) {
    throw new UnavailabilityError('TaskManager', 'unregisterTaskAsync');
  }

  _validateTaskName(taskName);
  await ExpoTaskManager.unregisterTaskAsync(taskName);
}

// @needsAudit
/**
 * Unregisters all tasks registered for the running app. You may want to call this when the user is
 * signing out and you no longer need to track his location or run any other background tasks.
 * @return A promise which fulfills as soon as all tasks are completely unregistered.
 */
export async function unregisterAllTasksAsync(): Promise<void> {
  if (!ExpoTaskManager.unregisterAllTasksAsync) {
    throw new UnavailabilityError('TaskManager', 'unregisterAllTasksAsync');
  }

  await ExpoTaskManager.unregisterAllTasksAsync();
}

if (ExpoTaskManager) {
  const eventEmitter = new EventEmitter(ExpoTaskManager);
  eventEmitter.addListener<TaskManagerTaskBody>(
    ExpoTaskManager.EVENT_NAME,
    async ({ data, error, executionInfo }) => {
      const { eventId, taskName } = executionInfo;
      const taskExecutor = tasks.get(taskName);
      let result: any = null;

      if (taskExecutor) {
        try {
          // Execute JS task
          result = await taskExecutor({ data, error, executionInfo });
        } catch (error) {
          console.error(`TaskManager: Task "${taskName}" failed:`, error);
        } finally {
          // Notify manager the task is finished.
          await ExpoTaskManager.notifyTaskFinishedAsync(taskName, { eventId, result });
        }
      } else {
        console.warn(
          `TaskManager: Task "${taskName}" has been executed but looks like it is not defined. Please make sure that "TaskManager.defineTask" is called during initialization phase.`
        );
        // No tasks defined -> we need to notify about finish anyway.
        await ExpoTaskManager.notifyTaskFinishedAsync(taskName, { eventId, result });
        // We should also unregister such tasks automatically as the task might have been removed
        // from the app or just renamed - in that case it needs to be registered again (with the new name).
        await ExpoTaskManager.unregisterTaskAsync(taskName);
      }
    }
  );
}

// @needsAudit
/**
 * Determine if the `TaskManager` API can be used in this app.
 * @return A promise fulfills with `true` if the API can be used, and `false` otherwise.
 * On the web it always returns `false`.
 */
export async function isAvailableAsync(): Promise<boolean> {
  return await ExpoTaskManager.isAvailableAsync();
}
