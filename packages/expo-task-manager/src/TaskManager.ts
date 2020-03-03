import { EventEmitter, UnavailabilityError } from '@unimodules/core';

import ExpoTaskManager from './ExpoTaskManager';

/**
 * Error object that can be received through TaskManagerTaskBody when the task fails.
 */
export interface TaskManagerError {
  code: string | number;
  message: string;
}

/**
 * Represents the object that is passed to the task executor.
 */
export interface TaskManagerTaskBody {
  /**
   * An object of data passed to the task executor. Its properties depends on the type of the task.
   */
  data: object;

  /**
   * Error object if the task failed or `null` otherwise.
   */
  error: TaskManagerError | null;

  /**
   * Additional details containing unique ID of task event and name of the task.
   */
  executionInfo: {
    eventId: string;
    taskName: string;
  };
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
 * @deprecated in favor of TaskManagerTask.
 */
export interface RegisteredTask extends TaskManagerTask {}

/**
 * Type of task executor – a function that handles the task.
 */
export type TaskManagerTaskExecutor = (body: TaskManagerTaskBody) => void;

const tasks: Map<string, TaskManagerTaskExecutor> = new Map<string, TaskManagerTaskExecutor>();

function _validateTaskName(taskName) {
  if (!taskName || typeof taskName !== 'string') {
    throw new TypeError('`taskName` must be a non-empty string.');
  }
}

/**
 * Method that you use to define a task – it saves given task executor under given task name
 * which must be correlated with the task name used when registering the task.
 *
 * @param taskName Name of the task. It must be the same as the name you provided when registering the task.
 * @param taskExecutor A function that handles the task.
 */
export function defineTask(taskName: string, taskExecutor: TaskManagerTaskExecutor) {
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

/**
 * Checks whether the task is already defined.
 *
 * @param taskName Name of the task.
 */
export function isTaskDefined(taskName: string): boolean {
  return tasks.has(taskName);
}

/**
 * Checks whether the task has been registered.
 *
 * @param taskName Name of the task.
 * @returns A promise resolving to boolean value. If `false` then even if the task is defined, it won't be called because it's not registered.
 */
export async function isTaskRegisteredAsync(taskName: string): Promise<boolean> {
  if (!ExpoTaskManager.isTaskRegisteredAsync) {
    throw new UnavailabilityError('TaskManager', 'isTaskRegisteredAsync');
  }

  _validateTaskName(taskName);
  return ExpoTaskManager.isTaskRegisteredAsync(taskName);
}

/**
 * Retrieves an `options` object for provided `taskName`.
 *
 * @param taskName Name of the task.
 */
export async function getTaskOptionsAsync<TaskOptions>(taskName: string): Promise<TaskOptions> {
  if (!ExpoTaskManager.getTaskOptionsAsync) {
    throw new UnavailabilityError('TaskManager', 'getTaskOptionsAsync');
  }

  _validateTaskName(taskName);
  return ExpoTaskManager.getTaskOptionsAsync(taskName);
}

/**
 * Provides informations about registered tasks.
 *
 * @returns Returns a promise resolving to an array containing all tasks registered by the app.
 */
export async function getRegisteredTasksAsync(): Promise<TaskManagerTask[]> {
  if (!ExpoTaskManager.getRegisteredTasksAsync) {
    throw new UnavailabilityError('TaskManager', 'getRegisteredTasksAsync');
  }

  return ExpoTaskManager.getRegisteredTasksAsync();
}

/**
 * Unregisters the task. Tasks are usually registered by other modules (e.g. expo-location).
 *
 * @param taskName Name of the task.
 */
export async function unregisterTaskAsync(taskName: string): Promise<void> {
  if (!ExpoTaskManager.unregisterTaskAsync) {
    throw new UnavailabilityError('TaskManager', 'unregisterTaskAsync');
  }

  _validateTaskName(taskName);
  await ExpoTaskManager.unregisterTaskAsync(taskName);
}

/**
 * Unregisters all tasks registered by the app. You may want to call this when the user is
 * signing out and you no longer need to track his location or run any other background tasks.
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
