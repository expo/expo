import { NativeModulesProxy, EventEmitter } from 'expo-core';

interface TaskBody {
  data: object,
  error: Error | null,
  executionInfo: {
    eventId: string,
    taskName: string,
  },
}

type Task = (body: TaskBody) => void;

const { ExpoTaskManager: TaskManager } = NativeModulesProxy;
const eventEmitter = new EventEmitter(TaskManager);
const tasks: Map<string, Task> = new Map<string, Task>();

let isRunningInGlobalScope = true;

function _validateTaskName(taskName) {
  if (!taskName || typeof taskName !== 'string') {
    throw new TypeError('`taskName` must be a non-empty string.')
  }
}

export function defineTask(taskName: string, task: Task) {
  if (!isRunningInGlobalScope) {
    console.error(`TaskManager.defineTask must be called in the global scope!`);
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
  _validateTaskName(taskName);
  return TaskManager.isTaskRegisteredAsync(taskName);
}

export async function getRegisteredTasksAsync(): Promise<object> {
  return TaskManager.getRegisteredTasksAsync();
}

export async function unregisterTaskAsync(taskName: string): Promise<null> {
  _validateTaskName(taskName);
  return TaskManager.unregisterTaskAsync(taskName);
}

export async function unregisterAllTasksAsync(): Promise<null> {
  return TaskManager.unregisterAllTasksAsync();
}

eventEmitter.addListener(TaskManager.EVENT_NAME, async ({ data, error, executionInfo }) => {
  const { eventId, taskName } = executionInfo;
  const task = tasks.get(taskName);
  let result: any = null;

  if (task) {
    try {
      // Execute JS task
      result = await task({ data, error, executionInfo });
    } catch (error) {
      console.error(`Background task '${taskName}' failed:`, error);
    } finally {
      // Notify manager the task is finished.
      await TaskManager.notifyTaskDidFinish(taskName, { eventId, result });
    }
  } else {
    console.log(`TaskManager: task ${taskName} not found :(`);
    // No tasks defined -> we need to notify about finish anyway.
    await TaskManager.notifyTaskDidFinish(taskName, { eventId, result });
    // We should also unregister such tasks automatically as the task might have been removed
    // from the app or just renamed - in that case it needs to be registered again (with the new name).
    await TaskManager.unregisterTaskAsync(taskName);
  }
});

// @tsapeta: Turn off `defineTask` function right after the global scope has been executed.
// Promise.resolve() ensures that it will be called as a microtask just after the first event loop.
Promise.resolve().then(() => {
  isRunningInGlobalScope = false;
});
