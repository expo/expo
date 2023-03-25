import type { CurrentlyRunningInfo } from './UpdatesProvider.types';
export declare const currentlyRunning: CurrentlyRunningInfo;
/**
 * Enumeration of the different possible event types passed into calls to the optional
 * `providerEventHandler` of [`useUpdates()`](#useupdatesprovidereventhandler).
 */
export declare enum UpdatesProviderEventType {
    /**
     * Type of event emitted when `checkForUpdate()` starts.
     */
    CHECK_START = "check_start",
    /**
     * Type of event emitted when `checkForUpdate()` completes successfully.
     */
    CHECK_COMPLETE = "check_complete",
    /**
     * Type of event emitted when `checkForUpdate()` completes with an error.
     */
    CHECK_ERROR = "check_error",
    /**
     * Type of event emitted when update download starts.
     */
    DOWNLOAD_START = "download_start",
    /**
     * Type of event emitted when update download completes successfully.
     */
    DOWNLOAD_COMPLETE = "download_complete",
    /**
     * Type of event emitted when update download completes with an error.
     */
    DOWNLOAD_ERROR = "download_error",
    /**
     * Type of event emitted when `runUpdate()` starts.
     */
    RUN_START = "run_start",
    /**
     * Type of event emitted when `runUpdate()` completes with an error.
     */
    RUN_ERROR = "run_error"
}
//# sourceMappingURL=UpdatesProvider.constants.d.ts.map