import { NativeBackgroundSession } from '../native';
import type { BackgroundSessionOptions, BackgroundSessionStatus } from '../types';

/**
 * Starts the foreground service that keeps location updates flowing while the app is in the
 * background, or, if the service is already promoted, re-posts its notification with the given
 * options.
 *
 * Passing `options` replaces and persists the stored configuration; omitting them reuses it. The
 * persisted configuration is re-applied the next time the app enters the foreground, so a session
 * survives the app being closed and reopened, but not a reboot.
 *
 * Does nothing below Android 8 (API 26), where background location is never throttled. Resolves
 * once the service has been promoted. A missing `POST_NOTIFICATIONS` permission is not an error —
 * the service runs and only its notification stays hidden.
 *
 * @throws if the manifest is missing `FOREGROUND_SERVICE` or `FOREGROUND_SERVICE_LOCATION`,
 * foreground location permission is not granted, a previous session is still stopping, the app is
 * in the background with no service running, or promotion does not complete within four seconds.
 *
 * @platform android
 */
export async function ensureBackgroundSessionStarted(
  options?: BackgroundSessionOptions
): Promise<void> {
  await NativeBackgroundSession.ensureStarted(options);
}

/**
 * Stops the foreground service and clears the persisted configuration, so no session is restarted
 * when the app next enters the foreground. Waits for an in-flight promotion to settle first.
 *
 * Background location tasks keep running afterwards, but the system throttles their updates while
 * the app is in the background, and `watchPosition` handles stop delivering until it returns to the
 * foreground.
 *
 * @platform android
 */
export async function stopBackgroundSession(): Promise<void> {
  await NativeBackgroundSession.stop();
}

/**
 * Reads the current state of the background session.
 * @platform android
 */
export function getBackgroundSessionStatus(): BackgroundSessionStatus {
  return NativeBackgroundSession.status();
}
