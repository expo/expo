import * as Updates from './Updates';
import { UpdateInfoType } from './UseUpdates.types';
// The currently running info, constructed from Updates constants
export const currentlyRunning = {
    updateId: Updates.updateId ?? undefined,
    channel: Updates.channel ?? undefined,
    createdAt: Updates.createdAt ?? undefined,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    isEmergencyLaunch: Updates.isEmergencyLaunch,
    manifest: Updates.manifest ?? undefined,
    runtimeVersion: Updates.runtimeVersion ?? undefined,
};
// Constructs an UpdateInfo from a manifest
export const updateFromManifest = (manifest) => {
    return {
        type: UpdateInfoType.NEW,
        updateId: manifest.id ?? '',
        createdAt: manifest && 'createdAt' in manifest && manifest.createdAt
            ? new Date(manifest.createdAt)
            : // We should never reach this if the manifest is valid and has a commit time,
                // but leave this in so that createdAt is always defined
                new Date(0),
        manifest,
    };
};
export const updateFromRollback = (rollback) => ({
    type: UpdateInfoType.ROLLBACK,
    createdAt: new Date(rollback.commitTime),
    manifest: undefined,
    updateId: undefined,
});
// Default useUpdates() state
export const defaultUseUpdatesState = {
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    isUpdatePending: false,
};
// Transform the useUpdates() state based on native state machine context
export const reduceUpdatesStateFromContext = (updatesState, context) => {
    const availableUpdate = context?.latestManifest
        ? updateFromManifest(context?.latestManifest)
        : context.rollback
            ? updateFromRollback(context.rollback)
            : undefined;
    const downloadedUpdate = context?.downloadedManifest
        ? updateFromManifest(context?.downloadedManifest)
        : context.rollback
            ? updateFromRollback(context.rollback)
            : undefined;
    return {
        ...updatesState,
        isUpdateAvailable: context.isUpdateAvailable,
        isUpdatePending: context.isUpdatePending,
        isChecking: context.isChecking,
        isDownloading: context.isDownloading,
        availableUpdate,
        downloadedUpdate,
        checkError: context.checkError,
        downloadError: context.downloadError,
        lastCheckForUpdateTimeSinceRestart: context.lastCheckForUpdateTime,
    };
};
//# sourceMappingURL=UseUpdatesUtils.js.map