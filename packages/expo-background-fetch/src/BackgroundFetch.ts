import { Platform, NativeModulesProxy } from 'expo-core';
import * as TaskManager from 'expo-task-manager';

const { ExpoBackgroundFetch } = NativeModulesProxy;

enum BackgroundFetchResult {
  NoData = 1,
  NewData = 2,
  Failed = 3,
}

enum BackgroundFetchStatus {
  Denied = 1,
  Restricted = 2,
  Available = 3,
}

export async function getStatusAsync(): Promise<BackgroundFetchStatus | null> {
  if (Platform.OS !== 'ios') {
    return Promise.resolve(null);
  }
  return ExpoBackgroundFetch.getStatusAsync();
}

export async function setMinimumIntervalAsync(minimumInterval: number): Promise<void> {
  if (Platform.OS !== 'ios') {
    console.warn(`expo-background-fetch is currently available only on iOS`);
    return;
  }
  await ExpoBackgroundFetch.setMinimumIntervalAsync(minimumInterval);
}

export async function registerTaskAsync(taskName: string): Promise<void> {
  if (Platform.OS !== 'ios') {
    console.warn(`expo-background-fetch is currently available only on iOS`);
    return;
  }
  if (!TaskManager.isTaskDefined(taskName)) {
    throw new Error(
      `Task '${taskName}' is not defined. You must define a task using TaskManager.defineTask before registering.`
    );
  }
  await ExpoBackgroundFetch.registerTaskAsync(taskName);
}

export async function unregisterTaskAsync(taskName: string): Promise<void> {
  if (Platform.OS !== 'ios') {
    console.warn(`expo-background-fetch is currently available only on iOS`);
    return;
  }
  await ExpoBackgroundFetch.unregisterTaskAsync(taskName);
}

export {
  BackgroundFetchResult as Result,
  BackgroundFetchStatus as Status,
};
