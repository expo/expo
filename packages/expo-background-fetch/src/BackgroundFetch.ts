import * as TaskManager from 'expo-task-manager';
import { UnavailabilityError } from '@unimodules/core';
import { Platform, NativeModulesProxy } from '@unimodules/core';

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

interface BackgroundFetchOptions {
  minimumInterval?: number;
  stopOnTerminate?: boolean;
  startOnBoot?: boolean;
}

export async function getStatusAsync(): Promise<BackgroundFetchStatus | null> {
  if (Platform.OS !== 'ios') {
    return BackgroundFetchStatus.Available;
  }
  return ExpoBackgroundFetch.getStatusAsync();
}

export async function setMinimumIntervalAsync(minimumInterval: number): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }
  await ExpoBackgroundFetch.setMinimumIntervalAsync(minimumInterval);
}

export async function registerTaskAsync(taskName: string, options: BackgroundFetchOptions = {}): Promise<void> {
  if (!ExpoBackgroundFetch.registerTaskAsync) {
    throw new UnavailabilityError('BackgroundFetch', 'registerTaskAsync')
  }
  if (!TaskManager.isTaskDefined(taskName)) {
    throw new Error(
      `Task '${taskName}' is not defined. You must define a task using TaskManager.defineTask before registering.`
    );
  }
  await ExpoBackgroundFetch.registerTaskAsync(taskName, options);
}

export async function unregisterTaskAsync(taskName: string): Promise<void> {
  if (!ExpoBackgroundFetch.unregisterTaskAsync) {
    throw new UnavailabilityError('BackgroundFetch', 'unregisterTaskAsync')
  }
  await ExpoBackgroundFetch.unregisterTaskAsync(taskName);
}

export {
  BackgroundFetchResult as Result,
  BackgroundFetchStatus as Status,
};
