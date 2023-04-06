import Constants from 'expo-constants';
import type { UpdatesLogEntry } from 'expo-updates';
export type ClassicManifest = NonNullable<typeof Constants.manifest>;
/**
 * The [modern manifest type](https://docs.expo.dev/versions/latest/sdk/constants/#manifest)
 */
export type Manifest = ClassicManifest | NonNullable<typeof Constants.manifest2>;
/**
 * Structure encapsulating information on the currently running app
 * (either the embedded bundle or a downloaded update).
 */
export type CurrentlyRunningInfo = {
    /**
     * The UUID that uniquely identifies the currently running update if `expo-updates` is enabled. The
     * UUID is represented in its canonical string form (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) and
     * will always use lowercase letters. In development mode, or any other environment in which
     * `expo-updates` is disabled, this value is `null`.
     */
    updateId: string | null;
    /**
     * The channel name of the current build, if configured for use with EAS Update. `null` otherwise.
     */
    channel: string | null;
    /**
     * If `expo-updates` is enabled, this is a `Date` object representing the creation time of the update
     * that's currently running (whether it was embedded or downloaded at runtime).
     *
     * In development mode, or any other environment in which `expo-updates` is disabled, this value is
     * `null`.
     */
    createdAt: Date | null;
    /**
     * This will be true if the currently running update is the one embedded in the build,
     * and not one downloaded from the updates server.
     */
    isEmbeddedLaunch: boolean;
    /**
     * `expo-updates` does its very best to always launch monotonically newer versions of your app so
     * you don't need to worry about backwards compatibility when you put out an update. In very rare
     * cases, it's possible that `expo-updates` may need to fall back to the update that's embedded in
     * the app binary, even after newer updates have been downloaded and run (an "emergency launch").
     * This boolean will be `true` if the app is launching under this fallback mechanism and `false`
     * otherwise. If you are concerned about backwards compatibility of future updates to your app, you
     * can use this constant to provide special behavior for this rare case.
     */
    isEmergencyLaunch: boolean;
    /**
     * If `expo-updates` is enabled, this is the
     * [manifest](https://docs.expo.dev/versions/latest/sdk/updates/#updatesmanifest) object for the update that's currently
     * running.
     *
     * In development mode, or any other environment in which `expo-updates` is disabled, this object is
     * empty.
     */
    manifest: Partial<Manifest> | null;
    /**
     * The runtime version of the current build.
     */
    runtimeVersion: string | null;
};
/**
 * Structure representing an available update that has been returned by a call to [`checkForUpdate()`](#checkforupdate)
 * or an [`UpdateEvent`](#updateevent) emitted by native code.
 */
export type AvailableUpdateInfo = {
    /**
     * A string that uniquely identifies the update. For the manifests used in the current Expo Updates protocol (including
     * EAS Update), this represents the update's UUID in its canonical string form (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
     * and will always use lowercase letters.
     */
    updateId: string | null;
    /**
     * A `Date` object representing the creation time of the update.
     */
    createdAt: Date | null;
    /**
     * The [manifest](https://docs.expo.dev/versions/latest/sdk/constants/#manifest) for the update.
     */
    manifest: Manifest;
};
/**
 * The structures and methods returned by `useUpdates()`.
 */
export type UseUpdatesReturnType = {
    /**
     * Information on the currently running app
     */
    currentlyRunning: CurrentlyRunningInfo;
    /**
     * If a new available update has been found, either by using checkForUpdate(),
     * or by the `UpdateEvent` listener in `useUpdates()`,
     * this will contain the information for that update.
     */
    availableUpdate?: AvailableUpdateInfo;
    /**
     * If an error is returned by any of the APIs to check for, download, or launch updates,
     * the error description will appear here.
     */
    error?: Error;
    /**
     * A `Date` object representing the last time this client checked for an available update,
     * or `undefined` if no check has yet occurred since the app started. Does not persist across
     * app reloads or restarts.
     */
    lastCheckForUpdateTimeSinceRestart?: Date;
    /**
     * If present, contains items of type [UpdatesLogEntry](https://docs.expo.dev/versions/latest/sdk/updates/#updateslogentry)
     * returned by the `getLogEntries()` method.
     */
    logEntries?: UpdatesLogEntry[];
};
export type UseUpdatesStateType = {
    availableUpdate?: AvailableUpdateInfo;
    error?: Error;
    lastCheckForUpdateTimeSinceRestart?: Date;
    logEntries?: UpdatesLogEntry[];
};
/**
 * The types of update-related events.
 */
export declare enum UseUpdatesEventType {
    /**
     * A new update is available for the app. This event can be fired either from
     * the native code that automatically checks for an update on startup (when automatic updates
     * are enabled), or from the completion of checkForUpdate().
     */
    UPDATE_AVAILABLE = "updateAvailable",
    /**
     * No new update is available for the app, and the most up-to-date update is already running.
     * This event can be fired either from
     * the native code that automatically checks for an update on startup (when automatic updates
     * are enabled), or from the completion of checkForUpdate().
     */
    NO_UPDATE_AVAILABLE = "noUpdateAvailable",
    /**
     * An error occurred.
     */
    ERROR = "error",
    /**
     * A call to `downloadUpdate()` has started.
     */
    DOWNLOAD_START = "downloadStart",
    /**
     * A call to `downloadUpdate()` has completed successfully.
     */
    DOWNLOAD_COMPLETE = "downloadComplete",
    /**
     * A call to `readLogEntries()` has completed successfully.
     */
    READ_LOG_ENTRIES_COMPLETE = "readLogEntriesComplete"
}
/**
 * An object that is passed into each event listener when an auto-update check occurs.
 */
export type UseUpdatesEvent = {
    /**
     * Type of the event.
     */
    type: UseUpdatesEventType;
    /**
     * If `type` is `UseUpdatesEvent.UPDATE_AVAILABLE`,
     * the manifest of the newly downloaded update, and `undefined` otherwise.
     */
    manifest?: Manifest;
    /**
     * If `type` is `UseUpdatesEventType.ERROR`, the error, and `undefined` otherwise.
     */
    error?: Error;
    /**
     * If `type` is `UseUpdatesEventType.READ_LOG_ENTRIES_COMPLETE`, the log entries returned, and `undefined` otherwise.
     */
    logEntries?: UpdatesLogEntry[];
};
//# sourceMappingURL=UseUpdates.types.d.ts.map