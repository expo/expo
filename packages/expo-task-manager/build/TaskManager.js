import { EventEmitter } from 'expo-core';
import { UnavailabilityError } from 'expo-errors';
import ExpoTaskManager from './ExpoTaskManager';
const eventEmitter = new EventEmitter(ExpoTaskManager);
const tasks = new Map();
let isRunningDuringInitialization = true;
function _validateTaskName(taskName) {
    if (!taskName || typeof taskName !== 'string') {
        throw new TypeError('`taskName` must be a non-empty string.');
    }
}
export function defineTask(taskName, task) {
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
export function isTaskDefined(taskName) {
    return tasks.has(taskName);
}
export async function isTaskRegisteredAsync(taskName) {
    if (!ExpoTaskManager.isTaskRegisteredAsync) {
        throw new UnavailabilityError('TaskManager', 'isTaskRegisteredAsync');
    }
    _validateTaskName(taskName);
    return ExpoTaskManager.isTaskRegisteredAsync(taskName);
}
export async function getTaskOptionsAsync(taskName) {
    if (!ExpoTaskManager.getTaskOptionsAsync) {
        throw new UnavailabilityError('TaskManager', 'getTaskOptionsAsync');
    }
    _validateTaskName(taskName);
    return ExpoTaskManager.getTaskOptionsAsync(taskName);
}
export async function getRegisteredTasksAsync() {
    if (!ExpoTaskManager.getRegisteredTasksAsync) {
        throw new UnavailabilityError('TaskManager', 'getRegisteredTasksAsync');
    }
    return ExpoTaskManager.getRegisteredTasksAsync();
}
export async function unregisterTaskAsync(taskName) {
    if (!ExpoTaskManager.unregisterTaskAsync) {
        throw new UnavailabilityError('TaskManager', 'unregisterTaskAsync');
    }
    _validateTaskName(taskName);
    await ExpoTaskManager.unregisterTaskAsync(taskName);
}
export async function unregisterAllTasksAsync() {
    if (!ExpoTaskManager.unregisterAllTasksAsync) {
        throw new UnavailabilityError('TaskManager', 'unregisterAllTasksAsync');
    }
    await ExpoTaskManager.unregisterAllTasksAsync();
}
eventEmitter.addListener(ExpoTaskManager.EVENT_NAME, async ({ data, error, executionInfo }) => {
    const { eventId, taskName } = executionInfo;
    const task = tasks.get(taskName);
    let result = null;
    if (task) {
        try {
            // Execute JS task
            result = await task({ data, error, executionInfo });
        }
        catch (error) {
            console.error(`TaskManager: Task "${taskName}" failed:`, error);
        }
        finally {
            // Notify manager the task is finished.
            await ExpoTaskManager.notifyTaskFinishedAsync(taskName, { eventId, result });
        }
    }
    else {
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
//# sourceMappingURL=TaskManager.js.map