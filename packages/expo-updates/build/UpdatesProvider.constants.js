import * as Updates from './Updates';
/////// Constants and enums  ////////
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
/**
 * Enumeration of the different possible event types passed into calls to the optional
 * `providerEventHandler` of [`useUpdates()`](#useupdatesprovidereventhandler).
 */
export var UpdatesProviderEventType;
(function (UpdatesProviderEventType) {
    /**
     * Type of event emitted when `checkForUpdate()` starts.
     */
    UpdatesProviderEventType["CHECK_START"] = "check_start";
    /**
     * Type of event emitted when `checkForUpdate()` completes successfully.
     */
    UpdatesProviderEventType["CHECK_COMPLETE"] = "check_complete";
    /**
     * Type of event emitted when `checkForUpdate()` completes with an error.
     */
    UpdatesProviderEventType["CHECK_ERROR"] = "check_error";
    /**
     * Type of event emitted when update download starts.
     */
    UpdatesProviderEventType["DOWNLOAD_START"] = "download_start";
    /**
     * Type of event emitted when update download completes successfully.
     */
    UpdatesProviderEventType["DOWNLOAD_COMPLETE"] = "download_complete";
    /**
     * Type of event emitted when update download completes with an error.
     */
    UpdatesProviderEventType["DOWNLOAD_ERROR"] = "download_error";
    /**
     * Type of event emitted when `runUpdate()` starts.
     */
    UpdatesProviderEventType["RUN_START"] = "run_start";
    /**
     * Type of event emitted when `runUpdate()` completes with an error.
     */
    UpdatesProviderEventType["RUN_ERROR"] = "run_error";
})(UpdatesProviderEventType || (UpdatesProviderEventType = {}));
//# sourceMappingURL=UpdatesProvider.constants.js.map