export enum LocationProfile {
  DEFAULT = 'default',
  AUTOMOTIVE_NAVIGATION = 'automotiveNavigation',
  OTHER_NAVIGATION = 'otherNavigation',
  FITNESS = 'fitness',
  AIRBORNE = 'airborne',
  LOW_POWER = 'lowPower',
}

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Position = {
  coordinates: Coordinates;
  horizontalAccuracy: number | null;
  timestamp: number;
  altitude: number | null;
  mslAltitude: number | null;
  verticalAccuracy: number | null;
  mocked: boolean;
  heading: number | null;
  headingAccuracy: number | null;
  speed: number | null;
  speedAccuracy: number | null;
};

export type GetPositionOptions = {
  maxCachedAge?: number;
  timeout?: number;
  profile?: LocationProfile;
};

export type PositionWatchError = {
  code: string;
  message: string;
};

export type PositionUpdate =
  | { data: Position; error: null }
  | { data: null; error: PositionWatchError };

export type PositionWatchStatus = {
  /**
   * Whether a session is configured. It does not mean positions are arriving — see
   * `canDeliverUpdates`.
   */
  isSubscribed: boolean;
  /**
   * Whether the subscription can deliver. `false` while no provider matches the request or Google
   * Play services reports location unavailable. Restarting the watcher does not clear it.
   *
   * @platform android
   */
  canDeliverUpdates: boolean;
  /** Whether the handle can still be brought back to sending. False only once released. */
  isHandleAlive: boolean;
  /** Whether a `positionChanged` listener is attached. */
  isStarted: boolean;
  isPaused: boolean;
  /**
   * Whether the watcher is allowed to run. `true` in the foreground, and in the background only
   * while a location foreground service is running.
   *
   * @platform android
   */
  areUpdatesAllowed: boolean;
  isInForeground: boolean;
};

export type WatchPositionParams = {
  profile?: LocationProfile;
  onPosition: (position: Position) => void;
  onError?: (error: PositionWatchError) => void;
};
