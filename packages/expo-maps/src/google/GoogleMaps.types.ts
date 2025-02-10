import type { SharedRef as SharedRefType } from 'expo/types';
import type { Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { CameraPosition, Coordinates } from '../shared.types';

/**
 * @platform android
 */
export type GoogleMapsMarker = {
  /**
   * The coordinates of the marker.
   */
  coordinates?: Coordinates;

  /**
   * The title of the marker, displayed in the callout when the marker is clicked.
   */
  title?: string;

  /**
   * The snippet of the marker, Displayed in the callout when the marker is clicked.
   */
  snippet?: string;

  /**
   * Whether the marker is draggable.
   */
  draggable?: boolean;

  /**
   * Whether the callout should be shown when the marker is clicked.
   */
  showCallout?: boolean;

  /**
   * The custom icon to display for the marker.
   */
  icon?: SharedRefType<'image'>;
};

/**
 * @platform android
 */
export type GoogleMapsUserLocation = {
  /**
   * User location coordinates.
   */
  coordinates: Coordinates;

  /**
   * Should the camera follow the users' location.
   */
  followUserLocation: boolean;
};

/**
 * @platform android
 */
export type GoogleMapsUISettings = {
  /**
   * Whether the compass is enabled on the map.
   * If enabled, the compass is only visible when the map is rotated.
   */
  compassEnabled?: boolean;

  /**
   * Whether the indoor level picker is enabled .
   */
  indoorLevelPickerEnabled?: boolean;

  /**
   * Whether the map toolbar is visible.
   */
  mapToolbarEnabled?: boolean;

  /**
   * Whether the my location button is visible.
   */
  myLocationButtonEnabled?: boolean;

  /**
   * Whether rotate gestures are enabled.
   */
  rotationGesturesEnabled?: boolean;

  /**
   * Whether the scroll gestures are enabled.
   */
  scrollGesturesEnabled?: boolean;

  /**
   * Whether the scroll gestures are enabled during rotation or zoom.
   */
  scrollGesturesEnabledDuringRotateOrZoom?: boolean;

  /**
   * Whether the tilt gestures are enabled.
   */
  tiltGesturesEnabled?: boolean;

  /**
   * Whether the zoom controls are visible.
   */
  zoomControlsEnabled?: boolean;

  /**
   * Whether the zoom gestures are enabled.
   */
  zoomGesturesEnabled?: boolean;

  /**
   * Whether the scale bar is displayed when zooming.
   */
  scaleBarEnabled?: boolean;

  /**
   * Whether the user is allowed to change the pitch type.
   */
  togglePitchEnabled?: boolean;
};

/**
 * The type of map to display.
 * @platform android
 */
export enum GoogleMapsMapType {
  /**
   * Satellite imagery with roads and points of interest overlayed.
   */
  HYBRID = 'HYBRID',
  /**
   * Standard road map.
   */
  NORMAL = 'NORMAL',
  /**
   * Satellite imagery.
   */
  SATELLITE = 'SATELLITE',
  /**
   * Topographic data.
   */
  TERRAIN = 'TERRAIN',
}

/**
 * @platform android
 */
export type GoogleMapsProperties = {
  /**
   * Whether the building layer is enabled on the map.
   */
  isBuildingEnabled?: boolean;

  /**
   * Whether the indoor layer is enabled on the map.
   */
  isIndoorEnabled?: boolean;

  /**
   * Whether finding the user's location is enabled on the map.
   */
  isMyLocationEnabled?: boolean;

  /**
   * Whether the traffic layer is enabled on the map.
   */
  isTrafficEnabled?: boolean;

  /**
   * Defines which map type should be used.
   */
  mapType?: GoogleMapsMapType;

  /**
   * If true, the user can select a location on the map to get more information.
   */
  selectionEnabled?: boolean;

  /**
   * The maximum zoom level for the map.
   */
  maxZoomPreference?: number;

  /**
   * The minimum zoom level for the map.
   */
  minZoomPreference?: number;
};

/**
 * @platform android
 */
export enum GoogleMapsColorScheme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  FOLLOW_SYSTEM = 'FOLLOW_SYSTEM',
}

/**
 * @platform android
 */
export type GoogleMapsViewProps = {
  ref?: Ref<GoogleMapsViewType>;
  style?: StyleProp<ViewStyle>;

  /**
   * The initial camera position of the map.
   */
  cameraPosition?: CameraPosition;

  /**
   * The array of markers to display on the map.
   */
  markers?: GoogleMapsMarker[];

  /**
   * The `MapUiSettings` to be used for UI-specific settings on the map.
   */
  uiSettings?: GoogleMapsUISettings;

  /**
   * The properties for the map.
   */
  properties?: GoogleMapsProperties;

  /**
   * Defines the color scheme for the map.
   */
  colorScheme?: GoogleMapsColorScheme;

  /**
   * User location, overrides default behavior.
   */
  userLocation?: GoogleMapsUserLocation;

  /**
   * Lambda invoked when the map is loaded.
   */
  onMapLoaded?: () => void;

  /**
   * Lambda invoked when the user clicks on the map.
   * It won't be invoked if the user clicks on POI or a marker.
   */
  onMapClick?: (event: { coordinates: Coordinates }) => void;

  /**
   * Lambda invoked when the user long presses on the map.
   */
  onMapLongClick?: (event: { coordinates: Coordinates }) => void;

  /**
   * Lambda invoked when a POI is clicked.
   */
  onPOIClick?: (event: { name: string; coordinates: Coordinates }) => void;

  /**
   * Lambda invoked when the marker is clicked
   */
  onMarkerClick?: (event: GoogleMapsMarker) => void;

  /**
   * Lambda invoked when the map was moved by the user.
   */
  onCameraMove?: (event: {
    coordinates: Coordinates;
    zoom: number;
    tilt: number;
    bearing: number;
  }) => void;
};

/**
 * @platform android
 */
export type SetCameraPositionConfig = CameraPosition & {
  /**
   * The duration of the animation in milliseconds.
   */
  duration?: number;
};

/**
 * @platform android
 */
export type GoogleMapsViewType = {
  /**
   * Update camera position.
   * @param config New camera position config.
   */
  setCameraPosition: (config?: SetCameraPositionConfig) => void;
};

/**
 * @platform android
 */
export type GoogleStreetViewProps = {
  style?: StyleProp<ViewStyle>;

  position?: Coordinates;
  isPanningGesturesEnabled?: boolean;
  isStreetNamesEnabled?: boolean;
  isUserNavigationEnabled?: boolean;
  isZoomGesturesEnabled?: boolean;
};
