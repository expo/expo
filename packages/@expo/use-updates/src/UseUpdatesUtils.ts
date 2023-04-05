import * as Updates from 'expo-updates';
import type { UpdateEvent } from 'expo-updates';

import type {
  AvailableUpdateInfo,
  CurrentlyRunningInfo,
  UseUpdatesCallbacksType,
  Manifest,
} from './UseUpdates.types';

// The currently running info, constructed from Updates constants
export const currentlyRunning: CurrentlyRunningInfo = {
  updateId: Updates.updateId,
  channel: Updates.channel,
  createdAt: Updates.createdAt,
  isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  isEmergencyLaunch: Updates.isEmergencyLaunch,
  manifest: Updates.manifest,
  runtimeVersion: Updates.runtimeVersion,
};

/////// Internal functions ////////

// Constructs the availableUpdate from the update manifest
export const availableUpdateFromManifest = (manifest?: Manifest) => {
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

// Constructs the available update from an event
export const availableUpdateFromEvent: (event: UpdateEvent) => {
  availableUpdate?: AvailableUpdateInfo;
  error?: Error;
} = (event) => {
  switch (event.type) {
    case Updates.UpdateEventType.NO_UPDATE_AVAILABLE:
      return {};
    case Updates.UpdateEventType.UPDATE_AVAILABLE:
      return {
        availableUpdate: availableUpdateFromManifest(event?.manifest || undefined),
      };
    case Updates.UpdateEventType.ERROR:
      return {
        error: new Error(event.message),
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
      return availableUpdateFromManifest(checkResult?.manifest || undefined);
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
