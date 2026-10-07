import type { EventSubscription } from 'expo';

import { NativeLocationModuleNext } from '../native';
import type { NativePositionWatchHandleClass } from '../native';
import { LocationProfile } from '../types';
import type {
  Position,
  PositionWatchError,
  PositionWatchStatus,
  WatchPositionParams,
} from '../types';

/**
 * Controls a running position watcher. Use `watchPosition()` to create one.
 *
 * See [Show live position on a screen](#show-live-position-on-a-screen).
 */
export class PositionWatchHandle {
  private readonly nativeHandle: NativePositionWatchHandleClass;

  /**
   * Creates and starts a native watcher without a listener. Prefer `watchPosition`, which also
   * attaches the listener.
   *
   * @param profile The use case that selects the accuracy and the update rate.
   */
  constructor(profile: LocationProfile = LocationProfile.DEFAULT) {
    this.nativeHandle = NativeLocationModuleNext.watchPosition(profile);
  }

  /**
   * Stops delivering positions and releases the system request, keeping the watcher for `resume()`.
   */
  pause(): void {
    this.nativeHandle.pause();
  }

  /**
   * Requests positions again after `pause()`.
   *
   * @return `true` when the request for updates succeeded, `false` when the provider refused it.
   * @throws After `dispose()`, like every other call on a disposed handle.
   */
  resume(): boolean {
    return this.nativeHandle.resume();
  }

  /**
   * Stages a new profile for the watcher. It has no effect until `restart()`.
   *
   * @return The same handle, for chaining.
   */
  withProfile(profile: LocationProfile): this {
    this.nativeHandle.withProfile(profile);
    return this;
  }

  /**
   * Stages the minimum time between two delivered positions, in seconds. It has no effect until
   * `restart()`. It is a throttle, not a rate: positions arrive at most that often, and less often
   * when the system has no new fix. `0` delivers every position the system produces.
   *
   * On Android, it replaces the update interval the profile requests from the provider. On iOS, the
   * system decides the rate and positions that arrive sooner than the interval are dropped.
   *
   * @param intervalSeconds A finite number of seconds, `0` or greater. Android throws for other values.
   * @return The same handle, for chaining.
   */
  withInterval(intervalSeconds: number): this {
    this.nativeHandle.withInterval(intervalSeconds);
    return this;
  }

  /**
   * Subscribes again with the settings staged by `withProfile()` and `withInterval()`.
   * It does not resume a paused watcher.
   *
   * @return `true` when the request for updates succeeded.
   */
  restart(): boolean {
    return this.nativeHandle.restart();
  }

  /**
   * Reads the current flags of the watcher.
   */
  status(): PositionWatchStatus {
    return this.nativeHandle.status();
  }

  /**
   * Removes all listeners and releases the native watcher.
   */
  dispose(): void {
    this.nativeHandle.removeAllListeners('positionChanged');
    this.nativeHandle.release();
  }

  /**
   * Subscribes to the position and error events. One watcher can have multiple listeners.
   *
   * @param onPosition Called when a new position is delivered.
   * @param onError Called when an error occurs.
   * @return A subscription object with a `remove` method that stops listening for changes.
   */
  addListener(
    onPosition: (position: Position) => void,
    onError?: (error: PositionWatchError) => void
  ): EventSubscription {
    return this.nativeHandle.addListener('positionChanged', ({ data, error }) => {
      if (error != null) {
        onError?.(error);
        return;
      }
      if (data != null) {
        onPosition(data);
      }
    });
  }
}

/**
 * Starts watching the position and returns the handle that controls the watcher.
 *
 * See [Show live position on a screen](#show-live-position-on-a-screen).
 *
 * @param params The profile and the callbacks for positions and errors.
 * @return The handle for controlling the watcher.
 * @throws When the foreground permission is not granted, when location services are off (iOS), or when
 * the selected provider cannot watch the position (Android).
 * @example
 * ```ts
 * const watcher = Location.watchPosition({
 *   profile: LocationProfile.FITNESS,
 *   onPosition: (position) => console.log(position.coordinates),
 *   onError: (error) => console.warn(error.code, error.message),
 * });
 *
 * // When the positions are no longer needed:
 * watcher.dispose();
 * ```
 */
export function watchPosition({
  profile = LocationProfile.DEFAULT,
  onPosition,
  onError,
}: WatchPositionParams): PositionWatchHandle {
  const handle = new PositionWatchHandle(profile);
  handle.addListener(onPosition, onError);
  return handle;
}
