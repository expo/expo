import * as Updates from './Updates';
import type { UpdateEvent } from './Updates.types';
import type { AvailableUpdateInfo, UpdatesInfo, UseUpdatesCallbacksType } from './UseUpdates.types';
import { currentlyRunning } from './UseUpdatesConstants';

/////// Internal functions ////////

// Constructs the availableUpdate from the update manifest
export const availableUpdateFromManifest = (manifest: Manifest) => {
  return manifest
    ? {
        updateId: manifest?.id ?? null,
        createdAt:
          manifest && 'createdAt' in manifest && manifest.createdAt
            ? new Date(manifest.createdAt)
            : manifest && 'publishedTime' in manifest && manifest.publishedTime
            ? new Date(manifest.publishedTime)
            : null,
        manifest,
      }
    : undefined;
};

// Constructs the UpdatesInfo from an event
export const updatesInfoFromEvent = (
  updatesInfo: UpdatesInfo | undefined,
  event: UpdateEvent
): UpdatesInfo => {
  const lastCheckForUpdateTime = new Date();
  if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
    return {
      ...updatesInfo,
      currentlyRunning,
      availableUpdate: undefined,
      error: undefined,
      lastCheckForUpdateTimeSinceRestart: lastCheckForUpdateTime,
    };
  } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
    return {
      ...updatesInfo,
      currentlyRunning,
      availableUpdate: availableUpdateFromManifest(event.manifest),
      error: undefined,
      lastCheckForUpdateTimeSinceRestart: lastCheckForUpdateTime,
    };
  } else {
    // event type === ERROR
    return {
      ...updatesInfo,
      currentlyRunning,
      availableUpdate: undefined,
      error: new Error(event.message),
      lastCheckForUpdateTimeSinceRestart: lastCheckForUpdateTime,
    };
  }
};

// Implementation of checkForUpdate
export const checkForUpdateAndReturnAvailableAsync: (
  callbacks?: UseUpdatesCallbacksType
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
export const downloadUpdateAsync = async (callbacks?: UseUpdatesCallbacksType) => {
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
export const runUpdateAsync = async (callbacks?: UseUpdatesCallbacksType) => {
  try {
    callbacks?.onRunUpdateStart && callbacks?.onRunUpdateStart();
    await Updates.reloadAsync();
  } catch (error: any) {
    callbacks?.onRunUpdateError && callbacks?.onRunUpdateError();
    throw error;
  }
};

// Implementation of downloadAndRunUpdate
export const downloadAndRunUpdateAsync = async (callbacks?: UseUpdatesCallbacksType) => {
  await downloadUpdateAsync(callbacks);
  await runUpdateAsync(callbacks);
};
