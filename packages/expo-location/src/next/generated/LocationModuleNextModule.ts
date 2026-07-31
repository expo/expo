// File hash: bc1115527297c7a1bd1e42f9289394a51b58cd4f659c1c1d6bf1140bed03094f
// Automatically generated with expo-type-information.
import type { SharedRef } from 'expo';
import { NativeModule, requireNativeModule } from 'expo';

import type { PermissionRequestResponse, Position } from './LocationModuleNext.types';
import { LocationProvider, LocationWatchHandle } from './LocationModuleNext.types';
export declare class LocationModuleNext extends NativeModule {
  setDefaultLocationProvider(
    provider: SharedRef<any>
  ): unknown /*The type couldn't be resolved automatically.*/;
  watchPosition(): LocationWatchHandle;
  requestForegroundPermissionsAsync(): Promise<PermissionRequestResponse>;
  getForegroundPermissionsAsync(): Promise<PermissionRequestResponse>;
  requestBackgroundPermissionsAsync(): Promise<PermissionRequestResponse>;
  getBackgroundPermissionsAsync(): Promise<PermissionRequestResponse>;
  getCurrentPositionAsync(): Promise<Position>;
  getLastKnownPositionAsync(): Promise<Position | null>;
  LocationProvider: typeof LocationProvider;
  LocationWatchHandle: typeof LocationWatchHandle;
}

const _default: LocationModuleNext = requireNativeModule<LocationModuleNext>('LocationModuleNext');
export default _default;
