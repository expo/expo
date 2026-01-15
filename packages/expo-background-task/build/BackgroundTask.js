import { isRunningInExpoGo } from 'expo';
import { startCliListenerAsync } from 'expo/devtools';
import { Platform, UnavailabilityError } from 'expo-modules-core';
import * as TaskManager from 'expo-task-manager';
import { BackgroundTaskStatus } from './BackgroundTask.types';
import ExpoBackgroundTaskModule from './ExpoBackgroundTaskModule';
// Flag to warn about running on Apple simulator
let warnAboutRunningOniOSSimulator = false;
let warnedAboutExpoGo = false;
function _validate(taskName) {
    if (isRunningInExpoGo()) {
        if (!warnedAboutExpoGo) {
            const message = '`Background Task` functionality is not available in Expo Go:\n' +
                'You can use this API and any others in a development build. Learn more: https://expo.fyi/dev-client.';
            console.warn(message);
            warnedAboutExpoGo = true;
        }
    }
    if (!taskName || typeof taskName !== 'string') {
        throw new TypeError('`taskName` must be a non-empty string.');
    }
}
// @needsAudit
/**
 * Returns the status for the Background Task API. On web, it always returns `BackgroundTaskStatus.Restricted`,
 * while on native platforms it returns `BackgroundTaskStatus.Available`.
 *
 * @returns A BackgroundTaskStatus enum value or `null` if not available.
 */
export const getStatusAsync = async () => {
    if (!ExpoBackgroundTaskModule.getStatusAsync) {
        throw new UnavailabilityError('BackgroundTask', 'getStatusAsync');
    }
    return isRunningInExpoGo()
        ? BackgroundTaskStatus.Restricted
        : ExpoBackgroundTaskModule.getStatusAsync();
};
// @needsAudit
/**
 * Registers a background task with the given name. Registered tasks are saved in persistent storage and restored once the app is initialized.
 * @param taskName Name of the task to register. The task needs to be defined first - see [`TaskManager.defineTask`](task-manager/#taskmanagerdefinetasktaskname-taskexecutor)
 * for more details.
 * @param options An object containing the background task options.
 *
 * @example
 * ```ts
 * import * as TaskManager from 'expo-task-manager';
 *
 * // Register the task outside of the component
 * TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, () => {
 *   try {
 *     await AsyncStorage.setItem(LAST_TASK_DATE_KEY, Date.now().toString());
 *   } catch (error) {
 *     console.error('Failed to save the last fetch date', error);
 *     return BackgroundTaskResult.Failed;
 *   }
 *   return BackgroundTaskResult.Success;
 * });
 * ```
 *
 * You can now use the `registerTaskAsync` function to register the task:
 *
 * ```ts
 * BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {});
 * ```
 */
export async function registerTaskAsync(taskName, options = {}) {
    if (!ExpoBackgroundTaskModule.registerTaskAsync) {
        throw new UnavailabilityError('BackgroundTask', 'registerTaskAsync');
    }
    if (!TaskManager.isTaskDefined(taskName)) {
        throw new Error(`Task '${taskName}' is not defined. You must define a task using TaskManager.defineTask before registering.`);
    }
    if ((await ExpoBackgroundTaskModule.getStatusAsync()) === BackgroundTaskStatus.Restricted) {
        if (!warnAboutRunningOniOSSimulator) {
            const message = Platform.OS === 'ios'
                ? `Background tasks are not supported on iOS simulators. Skipped registering task: ${taskName}.`
                : `Background tasks are not available in the current environment. Skipped registering task: ${taskName}.`;
            console.warn(message);
            warnAboutRunningOniOSSimulator = true;
        }
        return;
    }
    _validate(taskName);
    if (await TaskManager.isTaskRegisteredAsync(taskName)) {
        return;
    }
    await ExpoBackgroundTaskModule.registerTaskAsync(taskName, options);
}
// @needsAudit
/**
 * Unregisters a background task, so the application will no longer be executing this task.
 * @param taskName Name of the task to unregister.
 * @return A promise which fulfils when the task is fully unregistered.
 */
export async function unregisterTaskAsync(taskName) {
    if (!ExpoBackgroundTaskModule.unregisterTaskAsync) {
        throw new UnavailabilityError('BackgroundTask', 'unregisterTaskAsync');
    }
    _validate(taskName);
    if (!(await TaskManager.isTaskRegisteredAsync(taskName))) {
        return;
    }
    await ExpoBackgroundTaskModule.unregisterTaskAsync(taskName);
}
// @needsAudit
/**
 * When in debug mode this function will trigger running the background tasks.
 * This function will only work for apps built in debug mode.
 * This method is only available in development mode. It will not work in production builds.
 * @returns A promise which fulfils when the task is triggered.
 */
export async function triggerTaskWorkerForTestingAsync() {
    if (__DEV__) {
        if (!ExpoBackgroundTaskModule.triggerTaskWorkerForTestingAsync) {
            throw new UnavailabilityError('BackgroundTask', 'triggerTaskWorkerForTestingAsync');
        }
        console.log('Calling triggerTaskWorkerForTestingAsync');
        return await ExpoBackgroundTaskModule.triggerTaskWorkerForTestingAsync();
    }
    else {
        return Promise.resolve(false);
    }
}
// @needsAudit
/**
 * Adds a listener that is called when the background executor expires. On iOS, tasks can run
 * for minutes, but the system can interrupt the process at any time. This listener is called
 * when the system decides to stop the background tasks and should be used to clean up resources
 * or save state. When the expiry handler is called, the main task runner is rescheduled automatically.
 * @platform ios
 * @return An object with a `remove` method to unsubscribe the listener.
 */
export function addExpirationListener(listener) {
    if (!ExpoBackgroundTaskModule.addListener) {
        throw new UnavailabilityError('BackgroundTask', 'addListener');
    }
    return ExpoBackgroundTaskModule.addListener('onTasksExpired', listener);
}
const PLUGIN_NAME = 'expo-background-task-cli-extension';
const GET_REGISTERED_TASKS = 'getRegisteredBackgroundTasks';
const TRIGGER_TASKS = 'triggerBackgroundTasks';
startCliListenerAsync(PLUGIN_NAME)
    .then(({ addMessageListener }) => {
    // Handle the trigger background tasks request
    addMessageListener(TRIGGER_TASKS, async ({ sendResponseAsync }) => {
        const tasks = await TaskManager.getRegisteredTasksAsync();
        if (tasks.length === 0) {
            await sendResponseAsync('No background tasks registered to trigger.');
            return;
        }
        // Trigger the background tasks
        await triggerTaskWorkerForTestingAsync();
        await sendResponseAsync(`${tasks.length} tasks triggered successfully.`);
    });
    // Handle the get registered tasks request
    addMessageListener(GET_REGISTERED_TASKS, async ({ sendResponseAsync }) => {
        const tasks = await TaskManager.getRegisteredTasksAsync();
        const message = tasks.length === 0
            ? 'No background tasks registered.'
            : `${tasks.length} task(s): ${tasks.map((task) => `"${task.taskName}"`).join(', ')}.`;
        await sendResponseAsync(message);
    });
})
    .catch((error) => {
    console.error('Failed to start app listeners for expo-backgroundtask-devtools-plugin:', error);
});
// Export types
export { BackgroundTaskStatus, BackgroundTaskResult, } from './BackgroundTask.types';
//# sourceMappingURL=BackgroundTask.js.map