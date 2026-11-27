import type { TaskManagerError } from 'expo-task-manager';

/**
 * A circular region monitored by `GeofencingHandle`.
 */
export type GeofencingRegion = {
  /**
   * Identifies the region in the events delivered to the task. Starting a region with an
   * identifier that is already monitored replaces that region.
   */
  identifier: string;
  /**
   * The latitude of the center, in degrees.
   */
  latitude: number;
  /**
   * The longitude of the center, in degrees.
   */
  longitude: number;
  /**
   * The radius, in meters.
   */
  radius: number;
};

/**
 * The relation of the device to a monitored region.
 */
export enum GeofencingEventState {
  /**
   * The device is inside the region.
   */
  Inside = 'inside',
  /**
   * The device is outside the region.
   */
  Outside = 'outside',
}

/**
 * An event delivered to the task defined with `defineGeofencingTask`.
 * The same state can be delivered more than once for a region, for example after `start()` or after the app is relaunched.
 */
export type GeofencingEvent = {
  /**
   * The `identifier` of the region the event is for.
   */
  identifier: string;
  /**
   * The state of the region when the event was determined.
   */
  state: GeofencingEventState;
  /**
   * When the state was determined, in milliseconds since the Unix epoch.
   */
  timestamp: number;
};

/**
 * The parameters of `defineGeofencingTask`.
 */
export type GeofencingTaskOptions = {
  /**
   * The name of the task. Must match the name passed to the `GeofencingHandle` constructor; both
   * default to the same name.
   */
  taskName?: string;
  /**
   * Called with every event delivered to the task.
   */
  onEvent: (event: GeofencingEvent) => void;
  /**
   * Called when the task receives an error instead of an event. After an error no region delivers
   * events until `start` is called again.
   */
  onError?: (error: TaskManagerError) => void;
};
