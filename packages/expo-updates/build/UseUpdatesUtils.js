import * as Updates from './Updates';
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
    return manifest
        ? {
            updateId: manifest?.id ?? undefined,
            createdAt: manifest && 'createdAt' in manifest && manifest.createdAt
                ? new Date(manifest.createdAt)
                : manifest && 'publishedTime' in manifest && manifest.publishedTime
                    ? new Date(manifest.publishedTime)
                    : undefined,
            manifest: manifest ?? undefined,
        }
        : undefined;
};
// Constructs the availableUpdate from the native state change event context
export const availableUpdateFromContext = (context) => updateFromManifest(context?.latestManifest);
// Constructs the downloadedUpdate from the native state change event context
export const downloadedUpdateFromContext = (context) => updateFromManifest(context?.downloadedManifest);
// Default useUpdates() state
export const defaultUseUpdatesState = {
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    isUpdatePending: false,
};
// Transform the useUpdates() state based on native state machine context
export const reduceUpdatesStateFromContext = (updatesState, context) => {
    if (context.isChecking) {
        return {
            ...updatesState,
            isChecking: true,
            lastCheckForUpdateTimeSinceRestart: new Date(),
        };
    }
    const availableUpdate = availableUpdateFromContext(context);
    const downloadedUpdate = downloadedUpdateFromContext(context);
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
    };
};
//# sourceMappingURL=UseUpdatesUtils.js.map