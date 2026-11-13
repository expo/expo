/**
 * Lifecycle of the Android foreground service.
 * @platform android
 */
export enum BackgroundSessionState {
  /** No service is running, and none is being started or stopped. */
  NOT_RUNNING = 'NOT_RUNNING',
  /**
   * The service is in transition. It is either starting and not yet promoted to the foreground, or
   * stopping and not yet destroyed.
   */
  PENDING = 'PENDING',
  /**
   * The service is running in the foreground. On Android 13 and later, its notification appears
   * in the notification drawer only when the `android.permission.POST_NOTIFICATIONS` permission
   * is granted.
   */
  PROMOTED = 'PROMOTED',
}

/**
 * Configuration of the background session.
 * @platform android
 */
export type BackgroundSessionOptions = {
  /** Notification title. Defaults to the application name. */
  notificationTitle?: string;
  /** Notification body. When omitted, the notification has no text. */
  notificationBody?: string;
  /**
   * Notification accent color as an RGB integer, such as `0x2196f3`. When set, the notification is
   * colorized.
   */
  notificationColor?: number;
  /**
   * Whether to stop the service when the user swipes the app away from the Recents screen. The
   * configuration stays persisted, so the service starts again the next time the app comes to the
   * foreground. Defaults to `false`.
   */
  stopOnTaskRemoved?: boolean;
};

/**
 * State of the background session, returned by `getBackgroundSessionStatus`.
 * @platform android
 */
export type BackgroundSessionStatus = {
  /** The lifecycle state of the foreground service. */
  state: BackgroundSessionState;
  /** The value currently in effect, which is `false` whenever no service is running. */
  stopOnTaskRemoved: boolean;
  /**
   * Whether location updates keep flowing while the app is in the background.
   * `true` while the service is promoted, and always `true` on Android 7 and earlier, where no
   * throttling exists.
   */
  unthrottled: boolean;
};
