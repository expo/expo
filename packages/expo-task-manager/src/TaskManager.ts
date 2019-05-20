import { EventEmitter } from '@unimodules/core';
import { UnavailabilityError } from '@unimodules/core';
import ExpoTaskManager from './ExpoTaskManager';

interface TaskError {
  code: string | number,
  message: string,
}

interface TaskBody {
  data: object,
  error: TaskError | null,
  executionInfo: {
    eventId: string,
    taskName: string,
  },
}

export interface RegisteredTask {
  taskName: string,
  taskType: string,
  options: any,
}

type Task = (body: TaskBody) => void;

const eventEmitter = new EventEmitter(ExpoTaskManager);
const tasks: Map<string, Task> = new Map<string, Task>();

let isRunningDuringInitialization = true;

function _validateTaskName(taskName) {
  if (!taskName || typeof taskName !== 'string') {
    throw new TypeError('`taskName` must be a non-empty string.')
  }
}

export function defineTask(taskName: string, task: Task) {
  if (!isRunningDuringInitialization) {
    console.error(`TaskManager.defineTask must be called during initialization phase!`);
    return;
  }
  if (!taskName || typeof taskName !== 'string') {
    console.warn(`TaskManager.defineTask: 'taskName' argument must be a non-empty string.`);
    return;
  }
  if (!task || typeof task !== 'function') {
    console.warn(`TaskManager.defineTask: 'task' argument must be a function.`);
    return;
  }
  if (tasks.has(taskName)) {
    console.warn(`TaskManager.defineTask: task '${taskName}' is already defined.`);
    return;
  }
  tasks.set(taskName, task);
}

export function isTaskDefined(taskName: string): boolean {
  return tasks.has(taskName);
}

export async function isTaskRegisteredAsync(taskName: string): Promise<boolean> {
  if (!ExpoTaskManager.isTaskRegisteredAsync) {
    throw new UnavailabilityError('TaskManager', 'isTaskRegisteredAsync')
  }

  _validateTaskName(taskName);
  return ExpoTaskManager.isTaskRegisteredAsync(taskName);
}

export async function getTaskOptionsAsync<TaskOptions>(taskName: string): Promise<TaskOptions> {
  if (!ExpoTaskManager.getTaskOptionsAsync) {
    throw new UnavailabilityError('TaskManager', 'getTaskOptionsAsync')
  }

  _validateTaskName(taskName);
  return ExpoTaskManager.getTaskOptionsAsync(taskName);
}

export async function getRegisteredTasksAsync(): Promise<RegisteredTask[]> {
  if (!ExpoTaskManager.getRegisteredTasksAsync) {
    throw new UnavailabilityError('TaskManager', 'getRegisteredTasksAsync')
  }

  return ExpoTaskManager.getRegisteredTasksAsync();
}

export async function unregisterTaskAsync(taskName: string): Promise<void> {
  if (!ExpoTaskManager.unregisterTaskAsync) {
    throw new UnavailabilityError('TaskManager', 'unregisterTaskAsync')
  }

  _validateTaskName(taskName);
  await ExpoTaskManager.unregisterTaskAsync(taskName);
}

export async function unregisterAllTasksAsync(): Promise<void> {
  if (!ExpoTaskManager.unregisterAllTasksAsync) {
    throw new UnavailabilityError('TaskManager', 'unregisterAllTasksAsync')
  }

  await ExpoTaskManager.unregisterAllTasksAsync();
}

eventEmitter.addListener<TaskBody>(ExpoTaskManager.EVENT_NAME, async ({ data, error, executionInfo }) => {
  const { eventId, taskName } = executionInfo;
  const task = tasks.get(taskName);
  let result: any = null;

  if (task) {
    try {
      // Execute JS task
      result = await task({ data, error, executionInfo });
    } catch (error) {
      console.error(`TaskManager: Task "${taskName}" failed:`, error);
    } finally {
      // Notify manager the task is finished.
      await ExpoTaskManager.notifyTaskFinishedAsync(taskName, { eventId, result });
    }
  } else {
    console.warn(`TaskManager: Task "${taskName}" has been executed but looks like it is not defined. Please make sure that "TaskManager.defineTask" is called during initialization phase.`);
    // No tasks defined -> we need to notify about finish anyway.
    await ExpoTaskManager.notifyTaskFinishedAsync(taskName, { eventId, result });
    // We should also unregister such tasks automatically as the task might have been removed
    // from the app or just renamed - in that case it needs to be registered again (with the new name).
    await ExpoTaskManager.unregisterTaskAsync(taskName);
  }
});

// @tsapeta: Turn off `defineTask` function right after the initialization phase.
// Promise.resolve() ensures that it will be called as a microtask just after the first event loop.
Promise.resolve().then(() => {
  isRunningDuringInitialization = false;
});
