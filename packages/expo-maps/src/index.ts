import { createPermissionHook } from 'expo-modules-core';

import ExpoMaps from './ExpoMaps';
import * as AppleTypes from './apple/AppleMaps.types';
import { AppleMapsView } from './apple/AppleMapsView';
import * as GoogleTypes from './google/GoogleMaps.types';
import { GoogleMapsView } from './google/GoogleMapsView';
import { StreetView as GoogleStreetView } from './google/GoogleStreetView';

export namespace GoogleMaps {
  export const View = GoogleMapsView;
  export const StreetView = GoogleStreetView;

  export const MapType = GoogleTypes.MapType;
  export type MapType = GoogleTypes.MapType;

  export const MapColorScheme = GoogleTypes.MapColorScheme;
  export type MapColorScheme = GoogleTypes.MapColorScheme;

  export type Marker = GoogleTypes.Marker;
  export type CameraPosition = GoogleTypes.CameraPosition;
  export type MapUiSettings = GoogleTypes.MapUiSettings;
  export type MapProperties = GoogleTypes.MapProperties;
  export type MapProps = GoogleTypes.MapProps;

  export type MapView = GoogleTypes.MapViewType;
}

export namespace AppleMaps {
  export const View = AppleMapsView;

  export const MapType = AppleTypes.MapType;
  export type MapType = AppleTypes.MapType;
  export type CameraPosition = AppleTypes.CameraPosition;
  export type MapProperties = AppleTypes.MapProperties;
  export type MapUiSettings = AppleTypes.MapUiSettings;
  export type Marker = AppleTypes.Marker;
}

export const requestPermissionsAsync = ExpoMaps.requestPermissionsAsync;
export const getPermissionsAsync = ExpoMaps.getPermissionsAsync;

/**
 * Check or request permissions to access the location.
 * This uses both `requestPermissionsAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = useLocationPermissions();
 * ```
 */
export const useLocationPermissions = createPermissionHook({
  getMethod: getPermissionsAsync,
  requestMethod: requestPermissionsAsync,
});

export * from './shared.types';
