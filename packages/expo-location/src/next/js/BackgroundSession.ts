import { NativeBackgroundSession } from '../native';
import type { BackgroundSessionOptions, BackgroundSessionStatus } from '../types';

/**
 * Starts the foreground service that keeps location updates flowing while the app is in the
 * background. If the service is already promoted, re-posts its notification with the given
 * options.
 *
 * Starting the service requires the app to be in the foreground. When no service is running, a
 * call from the background rejects, but it still persists the `options`, so the service starts
 * the next time the app comes to the foreground.
 *
 * The service keeps the `options` and restarts when the app is closed and reopened. Omitting
 * `options` uses the persisted configuration, or the default one if unset.
 *
 * Does nothing on Android 7 and earlier, where background location is never throttled.
 *
 * A missing `POST_NOTIFICATIONS` permission is not an error. The service still runs, but its
 * notification does not appear in the notification drawer.
 *
 * See [Start a background session](#start-a-background-session).
 *
 * @throws if the manifest is missing `FOREGROUND_SERVICE` or `FOREGROUND_SERVICE_LOCATION`,
 * foreground location permission is not granted, the app is in the background with no service
 * running, a previous session is still stopping, or promotion does not complete within four
 * seconds.
 *
 * @platform android
 */
export async function ensureBackgroundSessionStarted(
  options?: BackgroundSessionOptions
): Promise<void> {
  await NativeBackgroundSession.ensureStarted(options);
}

/**
 * Stops the foreground service and clears the persisted configuration.
 *
 * See [Start a background session](#start-a-background-session).
 *
 * @platform android
 */
export async function stopBackgroundSession(): Promise<void> {
  await NativeBackgroundSession.stop();
}

/**
 * Reads the current state of the background session.
 *
 * See [Start a background session](#start-a-background-session).
 *
 * @platform android
 */
export function getBackgroundSessionStatus(): BackgroundSessionStatus {
  return NativeBackgroundSession.status();
}
