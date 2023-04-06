import * as Updates from 'expo-updates';
import { UseUpdatesEventType } from './UseUpdates.types';
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
        case UseUpdatesEventType.NO_UPDATE_AVAILABLE:
            return {};
        case UseUpdatesEventType.UPDATE_AVAILABLE:
            return {
                availableUpdate: availableUpdateFromManifest(event?.manifest || undefined),
            };
        case UseUpdatesEventType.ERROR:
            return {
                error: event.error,
            };
        default:
            return {};
    }
};
//# sourceMappingURL=UseUpdatesUtils.js.map