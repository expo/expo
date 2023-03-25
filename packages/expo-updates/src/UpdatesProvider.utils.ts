import * as Updates from './Updates';
import type { Manifest, UpdateEvent } from './Updates.types';
import { UpdatesProviderEventType, currentlyRunning } from './UpdatesProvider.constants';
import type {
  AvailableUpdateInfo,
  UpdatesInfo,
  UpdatesProviderEvent,
} from './UpdatesProvider.types';

/////// Internal functions ////////

// Constructs the availableUpdate from the update manifest
export const availableUpdateFromManifest = (manifest: Partial<Manifest> | undefined) => {
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
      lastCheckForUpdateTime,
    };
  } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
    return {
      currentlyRunning,
      availableUpdate: availableUpdateFromManifest(event.manifest),
      lastCheckForUpdateTime,
    };
  } else {
    // event type === ERROR
    return {
      currentlyRunning,
      error: new Error(event.message),
      lastCheckForUpdateTime,
    };
  }
};

// Implementation of checkForUpdate
export const checkForUpdateAndReturnAvailableAsync: (
  providerEventHandler?: (event: UpdatesProviderEvent) => void
) => Promise<AvailableUpdateInfo | undefined> = async (providerEventHandler) => {
  try {
    providerEventHandler && providerEventHandler({ type: UpdatesProviderEventType.CHECK_START });
    const checkResult = await Updates.checkForUpdateAsync();
    providerEventHandler && providerEventHandler({ type: UpdatesProviderEventType.CHECK_COMPLETE });
    if (checkResult.isAvailable) {
      return availableUpdateFromManifest(checkResult.manifest);
    } else {
      return undefined;
    }
  } catch (error: any) {
    providerEventHandler &&
      providerEventHandler({ type: UpdatesProviderEventType.CHECK_ERROR, error });
    throw error;
  }
};

// Implementation of downloadUpdate
export const downloadUpdateAsync = async (
  providerEventHandler?: (event: UpdatesProviderEvent) => void
) => {
  try {
    providerEventHandler && providerEventHandler({ type: UpdatesProviderEventType.DOWNLOAD_START });
    await Updates.fetchUpdateAsync();
    providerEventHandler &&
      providerEventHandler({ type: UpdatesProviderEventType.DOWNLOAD_COMPLETE });
  } catch (error: any) {
    providerEventHandler &&
      providerEventHandler({ type: UpdatesProviderEventType.DOWNLOAD_ERROR, error });
    throw error;
  }
};

// Implementation of runUpdate
export const runUpdateAsync = async (
  providerEventHandler?: (event: UpdatesProviderEvent) => void
) => {
  try {
    providerEventHandler && providerEventHandler({ type: UpdatesProviderEventType.RUN_START });
    await Updates.reloadAsync();
  } catch (error: any) {
    providerEventHandler &&
      providerEventHandler({ type: UpdatesProviderEventType.RUN_ERROR, error });
    throw error;
  }
};

// Implementation of downloadAndRunUpdate
export const downloadAndRunUpdateAsync = async (
  providerEventHandler?: (event: UpdatesProviderEvent) => void
) => {
  await downloadUpdateAsync(providerEventHandler);
  await runUpdateAsync(providerEventHandler);
};
