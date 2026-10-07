import type { TaskManagerError } from 'expo-task-manager';

import { NativeLocationUpdatesHandle } from '../native';
import type { NativeLocationUpdatesHandleClass } from '../native';
import type { LocationProfile, Position } from '../types';

const DEFAULT_LOCATION_TASK_NAME = 'expo-location-background-location';

/**
 * Starts and stops the delivery of positions to the task defined with `defineLocationTask`.
 * The delivery is registered with the system, so it outlives the JS context: it survives the app
 * moving to the background and, with the background permission, the app being terminated.
 *
 * On Android, positions keep arriving after the app process ended. Requires the background permission.
 *
 * On iOS, positions come from `CLLocationUpdate.liveUpdates`. Requires the `location` background mode and
 * the foreground permission.
 *
 * See [Receive positions in the background](#receive-positions-in-the-background).
 */
export class LocationUpdatesHandle {
  private readonly nativeHandle: NativeLocationUpdatesHandleClass;

  /**
   * @param taskName The task that receives the positions. Must match the name passed to `defineLocationTask`;
   * both default to the same name.
   */
  constructor(taskName: string = DEFAULT_LOCATION_TASK_NAME) {
    this.nativeHandle = new NativeLocationUpdatesHandle(taskName);
  }

  /**
   * Stages the profile for the next `start()`. It has no effect on a delivery that is already running;
   * call `stop()` and `start()` again to apply it.
   *
   * @return The same handle, for chaining.
   */
  withProfile(profile: LocationProfile): this {
    this.nativeHandle.withProfile(profile);
    return this;
  }

  /**
   * Registers the delivery with the system and starts sending positions to the task.
   * @throws When location services are off or the required permission is missing: the background permission
   * on Android, the foreground permission on iOS, where the `location` background mode is also required.
   */
  start(): Promise<void> {
    return this.nativeHandle.start();
  }

  /**
   * Unregisters the delivery. Positions stop arriving and the app is no longer relaunched for them.
   */
  stop(): Promise<void> {
    return this.nativeHandle.stop();
  }

  /**
   * Checks whether the delivery is registered with the system. It stays registered across app restarts,
   * so check it on launch before calling `start()` again.
   */
  hasStarted(): Promise<boolean> {
    return this.nativeHandle.hasStarted();
  }
}

/**
 * Defines the task that receives the positions started with `LocationUpdatesHandle`.
 * Wraps `TaskManager.defineTask`, so call it in the global scope of a module imported at startup.
 * See [Receive positions in the background](#receive-positions-in-the-background).
 *
 * @param params The callbacks for positions and errors.
 */
export function defineLocationTask({
  taskName = DEFAULT_LOCATION_TASK_NAME,
  onPosition,
  onError,
}: {
  taskName?: string;
  onPosition: (position: Position) => void;
  onError?: (error: TaskManagerError) => void;
}): void {
  requireTaskManager().defineTask<Position>(taskName, async ({ data, error }) => {
    if (error) {
      onError?.(error);
      return;
    }
    onPosition(data);
  });
}

function requireTaskManager(): typeof import('expo-task-manager') {
  try {
    return require('expo-task-manager');
  } catch {
    throw new Error(
      "defineLocationTask couldn't define the background location task because the 'expo-task-manager' package isn't installed. Background location updates are delivered through it. Install it with `npx expo install expo-task-manager` and rebuild the app."
    );
  }
}
