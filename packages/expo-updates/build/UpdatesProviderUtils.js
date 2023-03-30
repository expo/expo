import * as Updates from './Updates';
import { currentlyRunning } from './UpdatesProviderConstants';
/////// Internal functions ////////
// Constructs the availableUpdate from the update manifest
export const availableUpdateFromManifest = (manifest) => {
    return manifest
        ? {
            updateId: manifest?.id ? manifest?.id : null,
            createdAt: manifest?.createdAt ? new Date(manifest?.createdAt) : null,
            manifest,
        }
        : undefined;
};
// Constructs the UpdatesInfo from an event
export const updatesInfoFromEvent = (event) => {
    const lastCheckForUpdateTime = new Date();
    if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
        return {
            currentlyRunning,
            lastCheckForUpdateTimeSinceRestart: lastCheckForUpdateTime,
        };
    }
    else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
        return {
            currentlyRunning,
            availableUpdate: availableUpdateFromManifest(event.manifest),
            lastCheckForUpdateTimeSinceRestart: lastCheckForUpdateTime,
        };
    }
    else {
        // event type === ERROR
        return {
            currentlyRunning,
            error: new Error(event.message),
            lastCheckForUpdateTimeSinceRestart: lastCheckForUpdateTime,
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
            return availableUpdateFromManifest(checkResult.manifest);
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
// Implementation of downloadAndRunUpdate
export const downloadAndRunUpdateAsync = async (callbacks) => {
    await downloadUpdateAsync(callbacks);
    await runUpdateAsync(callbacks);
};
//# sourceMappingURL=UpdatesProviderUtils.js.map