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

export * from './shared.types';
