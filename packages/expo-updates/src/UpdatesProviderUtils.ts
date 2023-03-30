import * as Updates from './Updates';
import type { Manifest, UpdateEvent } from './Updates.types';
import type {
  AvailableUpdateInfo,
  UpdatesInfo,
  UpdatesProviderCallbacksType,
} from './UpdatesProvider.types';
import { currentlyRunning } from './UpdatesProviderConstants';

/////// Internal functions ////////

// Constructs the availableUpdate from the update manifest
export const availableUpdateFromManifest = (manifest: Manifest | undefined) => {
  return manifest
    ? {
        updateId: manifest?.id ? manifest?.id : null,
        createdAt: manifest?.createdAt ? new Date(manifest?.createdAt) : null,
        manifest,
      }
    : undefined;
};

// Constructs the UpdatesInfo from an event
export const updatesInfoFromEvent = (event: UpdateEvent): UpdatesInfo => {
  const lastCheckForUpdateTime = new Date();
  if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
    return {
      currentlyRunning,
      lastCheckForUpdateTimeSinceRestart: lastCheckForUpdateTime,
    };
  } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
    return {
      currentlyRunning,
      availableUpdate: availableUpdateFromManifest(event.manifest),
      lastCheckForUpdateTimeSinceRestart: lastCheckForUpdateTime,
    };
  } else {
    // event type === ERROR
    return {
      currentlyRunning,
      error: new Error(event.message),
      lastCheckForUpdateTimeSinceRestart: lastCheckForUpdateTime,
    };
  }
};

// Implementation of checkForUpdate
export const checkForUpdateAndReturnAvailableAsync: (
  callbacks?: UpdatesProviderCallbacksType
) => Promise<AvailableUpdateInfo | undefined> = async (callbacks) => {
  try {
    callbacks?.onCheckForUpdateStart && callbacks?.onCheckForUpdateStart();
    const checkResult = await Updates.checkForUpdateAsync();
    callbacks?.onCheckForUpdateComplete && callbacks?.onCheckForUpdateComplete();
    if (checkResult.isAvailable) {
      return availableUpdateFromManifest(checkResult.manifest);
    } else {
      return undefined;
    }
  } catch (error: any) {
    callbacks?.onCheckForUpdateError && callbacks?.onCheckForUpdateError(error);
    throw error;
  }
};

// Implementation of downloadUpdate
export const downloadUpdateAsync = async (callbacks?: UpdatesProviderCallbacksType) => {
  try {
    callbacks?.onDownloadUpdateStart && callbacks?.onDownloadUpdateStart();
    await Updates.fetchUpdateAsync();
    callbacks?.onDownloadUpdateComplete && callbacks?.onDownloadUpdateComplete();
  } catch (error: any) {
    callbacks?.onDownloadUpdateError && callbacks?.onDownloadUpdateError(error);
    throw error;
  }
};

// Implementation of runUpdate
export const runUpdateAsync = async (callbacks?: UpdatesProviderCallbacksType) => {
  try {
    callbacks?.onRunUpdateStart && callbacks?.onRunUpdateStart();
    await Updates.reloadAsync();
  } catch (error: any) {
    callbacks?.onRunUpdateError && callbacks?.onRunUpdateError();
    throw error;
  }
};

// Implementation of downloadAndRunUpdate
export const downloadAndRunUpdateAsync = async (callbacks?: UpdatesProviderCallbacksType) => {
  await downloadUpdateAsync(callbacks);
  await runUpdateAsync(callbacks);
};
