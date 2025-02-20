import { createPermissionHook } from 'expo-modules-core';

import ExpoMaps from './ExpoMaps';
import * as AppleTypes from './apple/AppleMaps.types';
import { AppleMapsView } from './apple/AppleMapsView';
import * as GoogleTypes from './google/GoogleMaps.types';
import { GoogleMapsView } from './google/GoogleMapsView';
import { GoogleStreetView } from './google/GoogleStreetView';

/**
 * @hidden
 */
export namespace GoogleMaps {
  export const View = GoogleMapsView;
  export const StreetView = GoogleStreetView;

  export const MapType = GoogleTypes.GoogleMapsMapType;
  export type MapType = GoogleTypes.GoogleMapsMapType;

  export const MapColorScheme = GoogleTypes.GoogleMapsColorScheme;
  export type MapColorScheme = GoogleTypes.GoogleMapsColorScheme;

  export type Marker = GoogleTypes.GoogleMapsMarker;
  export type MapUISettings = GoogleTypes.GoogleMapsUISettings;
  export type MapProperties = GoogleTypes.GoogleMapsProperties;

  export type MapProps = GoogleTypes.GoogleMapsViewProps;
  export type MapView = GoogleTypes.GoogleMapsViewType;

  export type StreetViewProps = GoogleTypes.GoogleStreetViewProps;
}

/**
 * @hidden
 */
export namespace AppleMaps {
  export const View = AppleMapsView;

  export const MapType = AppleTypes.AppleMapsMapType;
  export type MapType = AppleTypes.AppleMapsMapType;

  export type Marker = AppleTypes.AppleMapsMarker;
  export type MapUISettings = AppleTypes.AppleMapsUISettings;
  export type MapProperties = AppleTypes.AppleMapsProperties;

  export type MapProps = AppleTypes.AppleMapsViewProps;
  export type MapView = AppleTypes.AppleMapsViewType;
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
