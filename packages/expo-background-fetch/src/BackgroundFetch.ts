import { Platform, NativeModulesProxy } from 'expo-core';
import { TaskManager } from 'expo-task-manager';

const { ExpoBackgroundFetch } = NativeModulesProxy;

enum Result {
  NoData = 1,
  NewData = 2,
  Failed = 3,
}

enum Status {
  Denied = 1,
  Restricted = 2,
  Available = 3,
}

async function getStatusAsync(): Promise<Status | void> {
  if (Platform.OS !== 'ios') {
    return Promise.resolve();
  }
  return ExpoBackgroundFetch.getStatusAsync();
}

async function setMinimumIntervalAsync(minimumInterval: number): Promise<void> {
  if (Platform.OS !== 'ios') {
    console.warn(`expo-background-fetch is currently available only on iOS`);
    return;
  }
  await ExpoBackgroundFetch.setMinimumIntervalAsync(minimumInterval);
}

async function registerTaskAsync(taskName: string): Promise<void> {
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

async function unregisterTaskAsync(taskName: string): Promise<void> {
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
