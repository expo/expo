import { Platform } from 'react-native';

import * as AppleTypes from './apple/AppleMaps.types';
import AppleMapsModule from './apple/AppleMapsModule';
import { MapView as AppleMapsView } from './apple/AppleMapsView';
import * as GoogleTypes from './google/GoogleMaps.types';
import GoogleMapsModule from './google/GoogleMapsModule';
import { MapView as GoogleMapsView } from './google/GoogleMapsView';
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

export const requestPermissionsAsync = async () => {
  return Platform.select({
    ios: AppleMapsModule?.requestPermissionsAsync,
    android: GoogleMapsModule?.requestPermissionsAsync,
  })?.();
};

export const getPermissionsAsync = async () => {
  return Platform.select({
    ios: AppleMapsModule?.getPermissionsAsync,
    android: GoogleMapsModule?.getPermissionsAsync,
  })?.();
};

export * from './shared.types';
