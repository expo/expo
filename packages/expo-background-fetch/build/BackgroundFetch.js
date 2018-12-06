import { Platform, NativeModulesProxy } from 'expo-core';
import { TaskManager } from 'expo-task-manager';
const { ExpoBackgroundFetch } = NativeModulesProxy;
var Result;
(function (Result) {
    Result[Result["NoData"] = 1] = "NoData";
    Result[Result["NewData"] = 2] = "NewData";
    Result[Result["Failed"] = 3] = "Failed";
})(Result || (Result = {}));
var Status;
(function (Status) {
    Status[Status["Denied"] = 1] = "Denied";
    Status[Status["Restricted"] = 2] = "Restricted";
    Status[Status["Available"] = 3] = "Available";
})(Status || (Status = {}));
async function getStatusAsync() {
    if (Platform.OS !== 'ios') {
        return Promise.resolve();
    }
    return ExpoBackgroundFetch.getStatusAsync();
}
async function setMinimumIntervalAsync(minimumInterval) {
    if (Platform.OS !== 'ios') {
        console.warn(`expo-background-fetch is currently available only on iOS`);
        return;
    }
    await ExpoBackgroundFetch.setMinimumIntervalAsync(minimumInterval);
}
async function registerTaskAsync(taskName) {
    if (Platform.OS !== 'ios') {
        console.warn(`expo-background-fetch is currently available only on iOS`);
        return;
    }
    if (!TaskManager.isTaskDefined(taskName)) {
        throw new Error(`Task '${taskName}' is not defined. You must define a task using TaskManager.defineTask before registering.`);
    }
    await ExpoBackgroundFetch.registerTaskAsync(taskName);
}
async function unregisterTaskAsync(taskName) {
    if (Platform.OS !== 'ios') {
        console.warn(`expo-background-fetch is currently available only on iOS`);
        return;
    }
    await ExpoBackgroundFetch.unregisterTaskAsync(taskName);
}
export const BackgroundFetch = {
    // enums
    Result,
    Status,
    // methods
    getStatusAsync,
    setMinimumIntervalAsync,
    registerTaskAsync,
    unregisterTaskAsync,
};
//# sourceMappingURL=BackgroundFetch.js.map