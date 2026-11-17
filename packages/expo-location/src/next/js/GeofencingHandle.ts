import { NativeGeofencingHandle } from '../native';
import type { NativeGeofencingHandleClass } from '../native';
import type { GeofencingRegion, GeofencingEvent, GeofencingTaskOptions } from '../types';
import { requireTaskManager } from './requireTaskManager';

const DEFAULT_GEOFENCING_TASK_NAME = 'ExpoLocationGeofencing';

/**
 * Starts and stops the monitoring of regions for the task defined with `defineGeofencingTask`.
 * The monitoring is registered with the system, so it outlives the JS context and the app process.
 *
 * Requires the background permission.
 */
export class GeofencingHandle {
  private readonly nativeHandle: NativeGeofencingHandleClass;

  /**
   * @param taskName The task that receives the events. Must match the name passed to
   * `defineGeofencingTask`; both default to the same name. ASCII letters and digits only.
   */
  constructor(taskName: string = DEFAULT_GEOFENCING_TASK_NAME) {
    this.nativeHandle = new NativeGeofencingHandle(taskName);
  }

  /**
   * Registers the monitoring with the system and starts delivering events for `regions` to the
   * task. Calling it again replaces the monitored regions.
   *
   * @throws when location services are off or the background permission is not granted.
   */
  start(regions: GeofencingRegion[]): Promise<void> {
    return this.nativeHandle.start(regions);
  }

  /**
   * Unregisters the monitoring. Events stop arriving and the app is no longer relaunched for them.
   */
  stop(): Promise<void> {
    return this.nativeHandle.stop();
  }

  /**
   * Checks whether the monitoring is registered with the system. It stays registered across app
   * restarts, so check it on launch before calling `start()` again.
   */
  hasStarted(): Promise<boolean> {
    return this.nativeHandle.hasStarted();
  }
}

/**
 * Defines the task that receives the events started with `GeofencingHandle`.
 * Wraps `TaskManager.defineTask`, so call it in the global scope of a module imported at startup.
 *
 * @param options The task name and the callbacks for events and errors.
 */
export function defineGeofencingTask({
  taskName = DEFAULT_GEOFENCING_TASK_NAME,
  onEvent,
  onError,
}: GeofencingTaskOptions): void {
  requireTaskManager('defineGeofencingTask').defineTask<GeofencingEvent>(
    taskName,
    async ({ data, error }) => {
      if (error) {
        onError?.(error);
        return;
      }
      onEvent(data);
    }
  );
}
