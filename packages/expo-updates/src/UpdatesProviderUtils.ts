import * as Updates from './Updates';
import type { UpdateEvent } from './Updates.types';
import type {
  AvailableUpdateInfo,
  UpdatesInfo,
  UseUpdatesCallbacksType,
} from './UpdatesProvider.types';
import { currentlyRunning } from './UpdatesProviderConstants';

/////// Internal functions ////////

// Constructs the availableUpdate from the update manifest
// Manifest is of type "any" until we no longer support classic updates
export const availableUpdateFromManifest = (manifest: any) => {
  return manifest
    ? {
        updateId: manifest?.id ?? null,
        createdAt: manifest?.createdAt
          ? new Date(manifest?.createdAt)
          : manifest?.publishedTime
          ? new Date(manifest?.publishedTime)
          : null,
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
