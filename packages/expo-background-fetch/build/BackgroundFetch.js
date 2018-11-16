import { Platform, NativeModulesProxy } from 'expo-core';
import { TaskManager } from 'expo-task-manager';
const { ExpoBackgroundFetch: BackgroundFetch } = NativeModulesProxy;
export var Result;
(function (Result) {
    Result[Result["NoData"] = 1] = "NoData";
    Result[Result["NewData"] = 2] = "NewData";
    Result[Result["Failed"] = 3] = "Failed";
})(Result || (Result = {}));
export var Status;
(function (Status) {
    Status[Status["Denied"] = 1] = "Denied";
    Status[Status["Restricted"] = 2] = "Restricted";
    Status[Status["Available"] = 3] = "Available";
})(Status || (Status = {}));
export async function getStatusAsync() {
    if (Platform.OS !== 'ios') {
        return Promise.resolve(null);
    }
    return BackgroundFetch.getStatusAsync();
}
export async function setMinimumIntervalAsync(minimumInterval) {
    if (Platform.OS !== 'ios') {
        console.warn('expo-background-fetch is not yet available on Android platform.');
        return null;
    }
    return BackgroundFetch.setMinimumIntervalAsync(minimumInterval);
}
export async function registerTaskAsync(taskName) {
    if (Platform.OS !== 'ios') {
        console.warn('expo-background-fetch is not yet available on Android platform.');
        return null;
    }
    if (!TaskManager.isTaskDefined(taskName)) {
        throw new Error(`Task '${taskName}' is not defined. You must define a task using TaskManager.defineTask before registering.`);
    }
    return BackgroundFetch.registerTaskAsync(taskName);
}
export async function unregisterTaskAsync(taskName) {
    if (Platform.OS !== 'ios') {
        console.warn('expo-background-fetch is not yet available on Android platform.');
        return null;
    }
    return BackgroundFetch.unregisterTaskAsync(taskName);
}
//# sourceMappingURL=BackgroundFetch.js.map