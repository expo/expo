// @needsAudit
/**
 * This return value is to let iOS know what the result of your background fetch was, so the
 * platform can better schedule future background fetches. Also, your app has up to 30 seconds
 * to perform the task, otherwise your app will be terminated and future background fetches
 * may be delayed.
 */
export enum BackgroundFetchResult {
  /**
   * There was no new data to download.
   */
  NoData = 1,
  /**
   * New data was successfully downloaded.
   */
  NewData = 2,
  /**
   * An attempt to download data was made but that attempt failed.
   */
  Failed = 3,
}

// @needsAudit
export enum BackgroundFetchStatus {
  /**
   * The user explicitly disabled background behavior for this app or for the whole system.
   */
  Denied = 1,
  /**
   * Background updates are unavailable and the user cannot enable them again. This status can occur
   * when, for example, parental controls are in effect for the current user.
   */
  Restricted = 2,
  /**
   * Background updates are available for the app.
   */
  Available = 3,
}

// @needsAudit
export interface BackgroundFetchOptions {
  /**
   * Inexact interval in seconds between subsequent repeats of the background fetch alarm. The final
   * interval may differ from the specified one to minimize wakeups and battery usage.
   * - On Android it defaults to __10 minutes__,
   * - On iOS it calls [`BackgroundFetch.setMinimumIntervalAsync`](#backgroundfetchsetminimumintervalasyncminimuminterval)
   *   behind the scenes and the default value is the smallest fetch interval supported by the system __(10-15 minutes)__.
   * Background fetch task receives no data, but your task should return a value that best describes
   * the results of your background fetch work.
   * @return Returns a promise that fulfils once the task is registered and rejects in case of any errors.
   */
  minimumInterval?: number;
  /**
   * Whether to stop receiving background fetch events after user terminates the app.
   * @default true
   * @platform android
   */
  stopOnTerminate?: boolean;
  /**
   * Whether to restart background fetch events when the device has finished booting.
   * @default false
   * @platform android
   */
  startOnBoot?: boolean;
}
