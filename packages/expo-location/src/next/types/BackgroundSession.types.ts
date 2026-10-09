/**
 * Lifecycle of the Android foreground service.
 * @platform android
 */
export enum BackgroundSessionState {
  /** No service is running, and none is being started or stopped. */
  NOT_RUNNING = 'NOT_RUNNING',
  /**
   * The service is in transition — either starting and not yet promoted to the foreground, or
   * stopping and not yet destroyed. Both directions report the same state.
   */
  PENDING = 'PENDING',
  /**
   * The service is running in the foreground. Its notification is only visible if the
   * `android.permission.POST_NOTIFICATIONS` permission is granted; without it the service still
   * runs and location updates are still unthrottled, but the notification does not appear in the
   * drawer and the service is only listed in the system task manager.
   */
  PROMOTED = 'PROMOTED',
}

/**
 * Configuration of the background session. Every field is optional, and omitted fields fall back
 * to the defaults described below rather than to the previously stored value.
 * @platform android
 */
export type BackgroundSessionOptions = {
  /** Notification title. Defaults to the application name. */
  notificationTitle?: string;
  /** Notification body. When omitted, the notification has no text. */
  notificationBody?: string;
  /** Notification accent color as an ARGB integer. When set, the notification is colorized. */
  notificationColor?: number;
  /**
   * Whether to stop the session when the user swipes the app away from recents. Defaults to
   * `false`, which keeps the service — and unthrottled location — running after the swipe.
   */
  stopOnTaskRemoved?: boolean;
};

/**
 * @platform android
 */
export type BackgroundSessionStatus = {
  state: BackgroundSessionState;
  /** The value currently in effect, which is `false` whenever no service is running. */
  stopOnTaskRemoved: boolean;
  /**
   * Whether location updates keep flowing while the app is in the background: tasks exempt from
   * throttling, watchers still delivering. True while the service is promoted, and always true
   * below Android 8 (API 26), where a foreground service is not required and no throttling exists.
   */
  unthrottled: boolean;
};
