import * as TaskManager from 'expo-task-manager';
import { UnavailabilityError } from '@unimodules/core';
import { Platform, NativeModulesProxy } from '@unimodules/core';
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
        return BackgroundFetchStatus.Available;
    }
    return ExpoBackgroundFetch.getStatusAsync();
}
export async function setMinimumIntervalAsync(minimumInterval) {
    if (Platform.OS !== 'ios') {
        return;
    }
    await ExpoBackgroundFetch.setMinimumIntervalAsync(minimumInterval);
}
export async function registerTaskAsync(taskName, options = {}) {
    if (!ExpoBackgroundFetch.registerTaskAsync) {
        throw new UnavailabilityError('BackgroundFetch', 'registerTaskAsync');
    }
    if (!TaskManager.isTaskDefined(taskName)) {
        throw new Error(`Task '${taskName}' is not defined. You must define a task using TaskManager.defineTask before registering.`);
    }
    await ExpoBackgroundFetch.registerTaskAsync(taskName, options);
}
export async function unregisterTaskAsync(taskName) {
    if (!ExpoBackgroundFetch.unregisterTaskAsync) {
        throw new UnavailabilityError('BackgroundFetch', 'unregisterTaskAsync');
    }
    await ExpoBackgroundFetch.unregisterTaskAsync(taskName);
}
export { BackgroundFetchResult as Result, BackgroundFetchStatus as Status, };
//# sourceMappingURL=BackgroundFetch.js.map