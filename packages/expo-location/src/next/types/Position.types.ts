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

export type PositionUpdate = { data: Position; error: null } | { data: null; error: string };

export type WatchPositionParams = {
  profile?: LocationProfile;
  onPosition: (position: Position) => void;
  onError?: (error: string) => void;
};
