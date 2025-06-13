"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundTaskResult = exports.BackgroundTaskStatus = exports.getStatusAsync = void 0;
exports.registerTaskAsync = registerTaskAsync;
exports.unregisterTaskAsync = unregisterTaskAsync;
exports.triggerTaskWorkerForTestingAsync = triggerTaskWorkerForTestingAsync;
const expo_1 = require("expo");
const devtools_1 = require("expo/devtools");
const Application = __importStar(require("expo-application"));
const DeviceInfo = __importStar(require("expo-device"));
const expo_modules_core_1 = require("expo-modules-core");
const TaskManager = __importStar(require("expo-task-manager"));
const BackgroundTask_types_1 = require("./BackgroundTask.types");
const ExpoBackgroundTaskModule_1 = __importDefault(require("./ExpoBackgroundTaskModule"));
// Flag to warn about running on Apple simulator
let warnAboutRunningOniOSSimulator = false;
let warnedAboutExpoGo = false;
if (__DEV__) {
    let clientRef = null;
    const cleanUps = [];
    const getDeviceName = () => {
        return expo_modules_core_1.Platform.OS === 'android'
            ? DeviceInfo.deviceName +
                ' - ' +
                DeviceInfo.osVersion +
                ' - API ' +
                DeviceInfo.platformApiLevel
            : DeviceInfo.deviceName;
    };
    (0, devtools_1.getDevToolsPluginClientAsync)('expo-backgroundtask-devtools-plugin')
        .then((client) => {
        if (clientRef != null) {
            // Clean up the previous client if it exists
            cleanUps.forEach((cleanup) => cleanup());
            cleanUps.length = 0;
        }
        clientRef = client;
        // Add message listeners
        cleanUps.push(client.addMessageListener('triggerBackgroundTasks', async (params) => {
            //console.log("Received 'triggerBackgroundTasks' message", Platform.OS);
            const tasks = await TaskManager.getRegisteredTasksAsync();
            if (tasks.length === 0) {
                //console.log("client.sendMessage('triggerBackgroundTasks_response')", Platform.OS);
                await client.sendMessage('triggerBackgroundTasks_response', {
                    message: 'No background tasks registered to trigger.',
                    deviceName: getDeviceName(),
                    applicationId: Application.applicationId,
                });
                return;
            }
            // Trigger the background tasks
            //console.log('Triggering background tasks for testing...', Platform.OS);
            await triggerTaskWorkerForTestingAsync();
            //console.log("client.sendMessage('triggerBackgroundTasks_response')", Platform.OS);
            await client.sendMessage('triggerBackgroundTasks_response', {
                message: `${tasks.length} tasks triggered successfully.`,
                deviceName: getDeviceName(),
                applicationId: Application.applicationId,
            });
        }).remove);
        cleanUps.push(client.addMessageListener('getRegisteredBackgroundTasks', async (params) => {
            //console.log("Received 'getRegisteredBackgroundTasks' message", Platform.OS, params);
            const tasks = await TaskManager.getRegisteredTasksAsync();
            const message = tasks.length === 0
                ? 'No background tasks registered.'
                : `${tasks.length} task(s): ${tasks.map((task) => `"${task.taskName}"`).join(', ')}.`;
            // console.log("client.sendMessage('getRegisteredBackgroundTasks_response')", {
            //   OS: Platform.OS,
            //   deviceName: getDeviceName(),
            //   applicationId: Application.applicationId,
            // });
            await client.sendMessage('getRegisteredBackgroundTasks_response', {
                message,
                deviceName: getDeviceName(),
                applicationId: Application.applicationId,
            });
        }).remove);
    })
        .catch((error) => {
        console.error('Failed to get dev tools plugin client:', error);
    });
    // Some type tricks to ensure the module is properly cleaned up
    if ('hot' in module && module.hot) {
        const hot = module.hot;
        if ('dispose' in hot && hot.dispose && hot.dispose instanceof Function) {
            hot.dispose(() => {
                // Clean up here
                cleanUps.forEach((cleanup) => cleanup());
                cleanUps.length = 0;
            });
        }
    }
}
function _validate(taskName) {
    if ((0, expo_1.isRunningInExpoGo)()) {
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
const getStatusAsync = async () => {
    if (!ExpoBackgroundTaskModule_1.default.getStatusAsync) {
        throw new expo_modules_core_1.UnavailabilityError('BackgroundTask', 'getStatusAsync');
    }
    return (0, expo_1.isRunningInExpoGo)()
        ? BackgroundTask_types_1.BackgroundTaskStatus.Restricted
        : ExpoBackgroundTaskModule_1.default.getStatusAsync();
};
exports.getStatusAsync = getStatusAsync;
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
async function registerTaskAsync(taskName, options = {}) {
    if (!ExpoBackgroundTaskModule_1.default.registerTaskAsync) {
        throw new expo_modules_core_1.UnavailabilityError('BackgroundTask', 'registerTaskAsync');
    }
    if (!TaskManager.isTaskDefined(taskName)) {
        throw new Error(`Task '${taskName}' is not defined. You must define a task using TaskManager.defineTask before registering.`);
    }
    if ((await ExpoBackgroundTaskModule_1.default.getStatusAsync()) === BackgroundTask_types_1.BackgroundTaskStatus.Restricted) {
        if (!warnAboutRunningOniOSSimulator) {
            const message = expo_modules_core_1.Platform.OS === 'ios'
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
    await ExpoBackgroundTaskModule_1.default.registerTaskAsync(taskName, options);
}
// @needsAudit
/**
 * Unregisters a background task, so the application will no longer be executing this task.
 * @param taskName Name of the task to unregister.
 * @return A promise which fulfils when the task is fully unregistered.
 */
async function unregisterTaskAsync(taskName) {
    if (!ExpoBackgroundTaskModule_1.default.unregisterTaskAsync) {
        throw new expo_modules_core_1.UnavailabilityError('BackgroundTask', 'unregisterTaskAsync');
    }
    _validate(taskName);
    if (!(await TaskManager.isTaskRegisteredAsync(taskName))) {
        return;
    }
    await ExpoBackgroundTaskModule_1.default.unregisterTaskAsync(taskName);
}
// @needsAudit
/**
 * When in debug mode this function will trigger running the background tasks.
 * This function will only work for apps built in debug mode.
 * This method is only available in development mode. It will not work in production builds.
 * @returns A promise which fulfils when the task is triggered.
 */
async function triggerTaskWorkerForTestingAsync() {
    if (__DEV__) {
        if (!ExpoBackgroundTaskModule_1.default.triggerTaskWorkerForTestingAsync) {
            throw new expo_modules_core_1.UnavailabilityError('BackgroundTask', 'triggerTaskWorkerForTestingAsync');
        }
        //console.log('Calling triggerTaskWorkerForTestingAsync');
        return await ExpoBackgroundTaskModule_1.default.triggerTaskWorkerForTestingAsync();
    }
    else {
        return Promise.resolve(false);
    }
}
// Export types
var BackgroundTask_types_2 = require("./BackgroundTask.types");
Object.defineProperty(exports, "BackgroundTaskStatus", { enumerable: true, get: function () { return BackgroundTask_types_2.BackgroundTaskStatus; } });
Object.defineProperty(exports, "BackgroundTaskResult", { enumerable: true, get: function () { return BackgroundTask_types_2.BackgroundTaskResult; } });
