import * as Updates from 'expo-updates';
// The currently running info, constructed from Updates constants
export const currentlyRunning = {
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
export const availableUpdateFromManifest = (manifest) => {
    return manifest
        ? {
            updateId: manifest?.id ?? null,
            createdAt: manifest && 'createdAt' in manifest && manifest.createdAt
                ? new Date(manifest.createdAt)
                : manifest && 'publishedTime' in manifest && manifest.publishedTime
                    ? new Date(manifest.publishedTime)
                    : null,
            manifest,
        }
        : undefined;
};
// Constructs the available update from an event
export const availableUpdateFromEvent = (event) => {
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
export const checkForUpdateAndReturnAvailableAsync = async (callbacks) => {
    try {
        callbacks?.onCheckForUpdateStart && callbacks?.onCheckForUpdateStart();
        const checkResult = await Updates.checkForUpdateAsync();
        callbacks?.onCheckForUpdateComplete && callbacks?.onCheckForUpdateComplete();
        if (checkResult.isAvailable) {
            return availableUpdateFromManifest(checkResult?.manifest || undefined);
        }
        else {
            return undefined;
        }
    }
    catch (error) {
        callbacks?.onCheckForUpdateError && callbacks?.onCheckForUpdateError(error);
        throw error;
    }
};
// Implementation of downloadUpdate
export const downloadUpdateAsync = async (callbacks) => {
    try {
        callbacks?.onDownloadUpdateStart && callbacks?.onDownloadUpdateStart();
        await Updates.fetchUpdateAsync();
        callbacks?.onDownloadUpdateComplete && callbacks?.onDownloadUpdateComplete();
    }
    catch (error) {
        callbacks?.onDownloadUpdateError && callbacks?.onDownloadUpdateError(error);
        throw error;
    }
};
// Implementation of runUpdate
export const runUpdateAsync = async (callbacks) => {
    try {
        callbacks?.onRunUpdateStart && callbacks?.onRunUpdateStart();
        await Updates.reloadAsync();
    }
    catch (error) {
        callbacks?.onRunUpdateError && callbacks?.onRunUpdateError();
        throw error;
    }
};
//# sourceMappingURL=UseUpdatesUtils.js.map