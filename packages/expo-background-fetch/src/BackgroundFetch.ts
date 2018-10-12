import { Platform, NativeModulesProxy } from 'expo-core';
import { TaskManager } from 'expo-task-manager';

const { ExpoBackgroundFetch: BackgroundFetch } = NativeModulesProxy;

interface ResultEnum {
  NO_DATA: string,
  NEW_DATA: string,
  FAILED: string,
};

interface StatusEnum {
  DENIED: string,
  RESTRICTED: string,
  AVAILABLE: string,
};

export const Result: ResultEnum = BackgroundFetch.Result;
export const Status: StatusEnum = BackgroundFetch.Status;

export async function getStatusAsync(): Promise<StatusEnum | null> {
  if (Platform.OS !== 'ios') {
    return Promise.resolve(null);
  }
  return BackgroundFetch.getStatusAsync();
}

export async function setMinimumIntervalAsync(minimumInterval: number): Promise<null> {
  if (Platform.OS !== 'ios') {
    throw new Error('expo-background-fetch is not yet available on Android platform.');
  }
  return BackgroundFetch.setMinimumIntervalAsync(minimumInterval);
}

export async function registerTaskAsync(taskName: string): Promise<null> {
  if (Platform.OS !== 'ios') {
    throw new Error('expo-background-fetch is not yet available on Android platform.');
  }
  if (!TaskManager.isTaskDefined(taskName)) {
    throw new Error(
      `Task '${taskName}' is not defined. You must define a task using TaskManager.defineTask before registering`
    );
  }
  return BackgroundFetch.registerTaskAsync(taskName);
}

export async function unregisterTaskAsync(taskName: string): Promise<null> {
  if (Platform.OS !== 'ios') {
    throw new Error('expo-background-fetch is not yet available on Android platform.');
  }
  return BackgroundFetch.unregisterTaskAsync(taskName);
}
