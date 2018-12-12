import { Platform, NativeModulesProxy } from 'expo-core';
import * as TaskManager from 'expo-task-manager';
const { ExpoBackgroundFetch } = NativeModulesProxy;
var BackgroundFetchResult;
(function (BackgroundFetchResult) {
    BackgroundFetchResult[BackgroundFetchResult["NoData"] = 1] = "NoData";
    BackgroundFetchResult[BackgroundFetchResult["NewData"] = 2] = "NewData";
    BackgroundFetchResult[BackgroundFetchResult["Failed"] = 3] = "Failed";
})(BackgroundFetchResult || (BackgroundFetchResult = {}));
var BackgroundFetchStatus;
(function (BackgroundFetchStatus) {
    BackgroundFetchStatus[BackgroundFetchStatus["Denied"] = 1] = "Denied";
    BackgroundFetchStatus[BackgroundFetchStatus["Restricted"] = 2] = "Restricted";
    BackgroundFetchStatus[BackgroundFetchStatus["Available"] = 3] = "Available";
})(BackgroundFetchStatus || (BackgroundFetchStatus = {}));
export async function getStatusAsync() {
    if (Platform.OS !== 'ios') {
        return Promise.resolve(null);
    }
    return ExpoBackgroundFetch.getStatusAsync();
}
export async function setMinimumIntervalAsync(minimumInterval) {
    if (Platform.OS !== 'ios') {
        console.warn(`expo-background-fetch is currently available only on iOS`);
        return;
    }
    await ExpoBackgroundFetch.setMinimumIntervalAsync(minimumInterval);
}
export async function registerTaskAsync(taskName) {
    if (Platform.OS !== 'ios') {
        console.warn(`expo-background-fetch is currently available only on iOS`);
        return;
    }
    if (!TaskManager.isTaskDefined(taskName)) {
        throw new Error(`Task '${taskName}' is not defined. You must define a task using TaskManager.defineTask before registering.`);
    }
    await ExpoBackgroundFetch.registerTaskAsync(taskName);
}
export async function unregisterTaskAsync(taskName) {
    if (Platform.OS !== 'ios') {
        console.warn(`expo-background-fetch is currently available only on iOS`);
        return;
    }
    await ExpoBackgroundFetch.unregisterTaskAsync(taskName);
}
export { BackgroundFetchResult as Result, BackgroundFetchStatus as Status, };
//# sourceMappingURL=BackgroundFetch.js.map