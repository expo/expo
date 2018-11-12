import { Platform, NativeModulesProxy } from 'expo-core';
import { TaskManager } from 'expo-task-manager';

const { ExpoBackgroundFetch: BackgroundFetch } = NativeModulesProxy;

export enum Result {
  NoData = 1,
  NewData = 2,
  Failed = 3,
}

export enum Status {
  Denied = 1,
  Restricted = 2,
  Available = 3,
}

export async function getStatusAsync(): Promise<Status | null> {
  if (Platform.OS !== 'ios') {
    return Promise.resolve(null);
  }
  return BackgroundFetch.getStatusAsync();
}

export async function setMinimumIntervalAsync(minimumInterval: number): Promise<null> {
  if (Platform.OS !== 'ios') {
    console.warn('expo-background-fetch is not yet available on Android platform.');
    return null;
  }
  return BackgroundFetch.setMinimumIntervalAsync(minimumInterval);
}

export async function registerTaskAsync(taskName: string): Promise<null> {
  if (Platform.OS !== 'ios') {
    console.warn('expo-background-fetch is not yet available on Android platform.');
    return null;
  }
  if (!TaskManager.isTaskDefined(taskName)) {
    throw new Error(
      `Task '${taskName}' is not defined. You must define a task using TaskManager.defineTask before registering.`
    );
  }
  return BackgroundFetch.registerTaskAsync(taskName);
}

export async function unregisterTaskAsync(taskName: string): Promise<null> {
  if (Platform.OS !== 'ios') {
    console.warn('expo-background-fetch is not yet available on Android platform.');
    return null;
  }
  return BackgroundFetch.unregisterTaskAsync(taskName);
}
