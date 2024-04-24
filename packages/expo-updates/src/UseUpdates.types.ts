import type { Manifest } from './Updates.types';

/**
 * Structure encapsulating information on the currently running app
 * (either the embedded bundle or a downloaded update).
 */
export type CurrentlyRunningInfo = {
  /**
   * The UUID that uniquely identifies the currently running update if `expo-updates` is enabled. The
   * UUID is represented in its canonical string form and will always use lowercase letters.
   * In development mode, or any other environment in which `expo-updates` is disabled, this value is undefined.
   * @example
   * `"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`
   */
  updateId?: string;
  /**
   * The channel name of the current build, if configured for use with EAS Update, `undefined` otherwise.
   */
  channel?: string;
  /**
   * If `expo-updates` is enabled, this is a `Date` object representing the creation time of the update
   * that's currently running (whether it was embedded or downloaded at runtime).
   *
   * In development mode, or any other environment in which `expo-updates` is disabled, this value is
   * undefined.
   */
  createdAt?: Date;
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
   * If `isEmergencyLaunch` is set to true, this will contain a string error message describing
   * what failed during initialization.
   */
  emergencyLaunchReason: string | null;
  /**
   * If `expo-updates` is enabled, this is the
   * [manifest](https://docs.expo.dev/versions/latest/sdk/updates/#updatesmanifest) object for the update that's currently
   * running.
   *
   * In development mode, or any other environment in which `expo-updates` is disabled, this object is
   * empty.
   */
  manifest?: Partial<Manifest>;
  /**
   * The runtime version of the current build.
   */
  runtimeVersion?: string;
};

/**
 * The different possible types of updates.
 * Currently, the only supported type is `UpdateInfoType.NEW`, indicating a new update that can be downloaded and launched
 * on the device.
 * In the future, other types of updates may be added to this list.
 */
export enum UpdateInfoType {
  /**
   * This is the type for new updates found on or downloaded from the update server, that are launchable on the device.
   */
  NEW = 'new',
  /**
   * This type is used when an update is a directive to roll back to the embedded bundle.
   */
  ROLLBACK = 'rollback',
}

/**
 * Structure representing a new update.
 */
export type UpdateInfoNew = {
  /**
   * The type of update.
   */
  type: UpdateInfoType.NEW;
  /**
   * For updates of type `UpdateInfoType.NEW`, this is
   * a string that uniquely identifies the update. For the manifests used in the current Expo Updates protocol (including
   * EAS Update), this represents the update's UUID in its canonical string form and will always use lowercase letters.
   * @example
   * `"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`
   */
  updateId: string;
  /**
   * For all types of updates, this is
   * a `Date` object representing the creation time or commit time of the update.
   */
  createdAt: Date;
  /**
   * For updates of type `UpdateInfoType.NEW`, this is
   * the [manifest](https://docs.expo.dev/versions/latest/sdk/constants/#manifest) for the update.
   */
  manifest: Manifest;
};

/**
 * Structure representing a rollback directive.
 */
export type UpdateInfoRollback = {
  /**
   * The type of update.
   */
  type: UpdateInfoType.ROLLBACK;
  /**
   * For updates of type `UpdateInfoType.ROLLBACK`, this is always set to `undefined`.
   */
  updateId: undefined;
  /**
   * For all types of updates, this is
   * a `Date` object representing the creation time or commit time of the update.
   */
  createdAt: Date;
  /**
   * For updates of type `UpdateInfoType.ROLLBACK`, this is always set to `undefined`.
   */
  manifest: undefined;
};

/**
 * Combined structure representing any type of update.
 */
export type UpdateInfo = UpdateInfoNew | UpdateInfoRollback;

/**
 * The structures and methods returned by [`useUpdates()`](#useupdates).
 */
export type UseUpdatesReturnType = {
  /**
   * Information on the currently running app.
   */
  currentlyRunning: CurrentlyRunningInfo;
  /**
   * If a new available update has been found, either by using [`checkForUpdateAsync()`](#updatescheckforupdateasync),
   * or by the `UpdateEvent` listener in `useUpdates()`, this will contain the information for that update.
   */
  availableUpdate?: UpdateInfo;
  /**
   * If an available update has been downloaded, this will contain the information
   * for that update.
   */
  downloadedUpdate?: UpdateInfo;
  /**
   * True if a new available update has been found, false otherwise.
   */
  isUpdateAvailable: boolean;
  /**
   * True if a new available update is available and has been downloaded.
   */
  isUpdatePending: boolean;
  /**
   * True if the app is currently checking for a new available update from the server.
   */
  isChecking: boolean;
  /**
   * True if the app is currently downloading an update from the server.
   */
  isDownloading: boolean;
  /**
   * If an error is returned from either the startup check for updates, or a call to [`checkForUpdateAsync()`](#updatescheckforupdateasync),
   * the error description will appear here.
   */
  checkError?: Error;
  /**
   * If an error is returned from either a startup update download, or a call to [`fetchUpdateAsync()`](#updatesfetchupdateasync),
   * the error description will appear here.
   */
  downloadError?: Error;
  /**
   * If an error occurs during initialization of [`useUpdates()`](#useupdates), the error description will appear here.
   */
  initializationError?: Error;
  /**
   * A `Date` object representing the last time this client checked for an available update,
   * or `undefined` if no check has yet occurred since the app started. Does not persist across
   * app reloads or restarts.
   */
  lastCheckForUpdateTimeSinceRestart?: Date;
};
