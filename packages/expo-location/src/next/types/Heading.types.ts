export type Heading = {
  trueHeading: number | null;
  magneticHeading: number;
  accuracy: number | null;
  timestamp: number;
};

export type HeadingWatchError = {
  code: string;
  message: string;
};

export type HeadingUpdate =
  | { data: Heading; error: null }
  | { data: null; error: HeadingWatchError };

/**
 * A snapshot of the heading watcher's flags, returned by `status()`.
 */
export type HeadingWatchStatus = {
  /**
   * Whether the watcher is subscribed to the heading sensor.
   */
  isSubscribed: boolean;
  /**
   * Whether the device has a rotation vector sensor the watcher can read.
   *
   * @platform android
   */
  canDeliverUpdates?: boolean;
  /**
   * Whether the handle can still be brought back to sending. False only once released.
   */
  isHandleAlive: boolean;
  /**
   * Whether delivery has been started. On Android, it is `true` while at least one listener is
   * attached.
   */
  isStarted: boolean;
  /**
   * Whether `pause()` was called and `resume()` was not called yet.
   */
  isPaused: boolean;
  /**
   * Whether the watcher is allowed to run. `true` while the app is in the foreground or the
   * background session is promoted, and always `true` on Android 7 and earlier.
   *
   * @platform android
   */
  areUpdatesAllowed?: boolean;
  /**
   * Whether the app is in the foreground. The watcher holds the sensor only while it is `true` or
   * while a location foreground service is running.
   *
   * @platform android
   */
  isInForeground?: boolean;
};

export type WatchHeadingParams = {
  filter?: number;
  onHeading: (heading: Heading) => void;
  /**
   * Called when the heading source reports an error. On iOS, the watcher stops and needs
   * `resume()` or `restart()`. On Android, the error reports an unreliable sensor and headings
   * keep arriving.
   */
  onError?: (error: HeadingWatchError) => void;
};
