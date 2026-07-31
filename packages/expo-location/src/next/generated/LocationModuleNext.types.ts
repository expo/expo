// File hash: cf250a912bce5f556b1b143ee3413434abe11e08b0a27de13f1f73fb59f00070
// Automatically generated with expo-type-information.
import type { SharedRef } from 'expo';
import { SharedObject } from 'expo';
export type Coordinates = {
  latitude: number;
  longitude: number;
};
export type Position = {
  coordinates: Coordinates;
  mslAltitude?: number;
  ellipsoidalAltitude?: number;
  speed?: number;
  horizontalAccuracy?: number;
  verticalAccuracy?: number;
  speedAccuracy?: number;
};
export type PermissionRequestResponse = {
  canAskAgain: boolean;
  expires: string;
  granted: boolean;
  status: string;
};

export enum ProviderOutcome {
  success = 'success',
  unavailable = 'unavailable',
  unsupported = 'unsupported',
}

export declare class LocationProvider extends SharedObject {
  static Apple(): SharedRef<any>;
  static GMS(): SharedRef<any>;
  static Android(): SharedRef<any>;
}

// These events may have payloads that weren't resolved!
export type LocationWatchHandleEvents = {
  positionChanged: (payload?: any) => void;
};
export declare class LocationWatchHandle extends SharedObject<LocationWatchHandleEvents> {
  pause(): void;
  resume(): void;
  getLastPosition(): Position | null;
}
