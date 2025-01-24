import * as AppleTypes from './apple/AppleMaps.types';
import { MapView as AppleMapsView } from './apple/AppleMapsView';
import * as GoogleTypes from './google/GoogleMaps.types';
import { MapView as GoogleMapsView } from './google/GoogleMapsView';

export namespace GoogleMaps {
  export const View = GoogleMapsView;

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

  export type MapProperties = AppleTypes.MapProperties;
  export type MapUiSettings = AppleTypes.MapUiSettings;
  export type Marker = AppleTypes.Marker;
}

export * from './shared.types';
