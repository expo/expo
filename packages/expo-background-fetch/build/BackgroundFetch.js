import { Platform, UnavailabilityError } from '@unimodules/core';
import * as TaskManager from 'expo-task-manager';
import { BackgroundFetchResult, BackgroundFetchStatus, } from './BackgroundFetch.types';
import ExpoBackgroundFetch from './ExpoBackgroundFetch';
export async function getStatusAsync() {
    if (Platform.OS === 'android') {
        return BackgroundFetchStatus.Available;
    }
    return ExpoBackgroundFetch.getStatusAsync();
}
export async function setMinimumIntervalAsync(minimumInterval) {
    if (!ExpoBackgroundFetch.setMinimumIntervalAsync) {
        return;
    }
    // iOS only
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
export { BackgroundFetchResult as Result, BackgroundFetchStatus as Status };
//# sourceMappingURL=BackgroundFetch.js.map