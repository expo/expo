import type { SharedRef as SharedRefType } from 'expo/types';
import type { PermissionResponse } from 'expo-modules-core';
import type { Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Coordinates } from '../shared.types';

export type Marker = {
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

export type UserLocation = {
  /**
   * User location coordinates.
   */
  coordinates: Coordinates;

  /**
   * Should the camera follow the users location.
   */
  followUserLocation: boolean;
};

export type CameraPosition = {
  /**
   * The middle point of the camera.
   */
  coordinates?: Coordinates;

  /**
   * The zoom level of the camera.
   * For some view sizez, lower zoom levels might not be available.
   */
  zoom?: number;
};

export type MapUiSettings = {
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
   * @platform ios
   */
  scaleBarEnabled?: boolean;

  /**
   * Whether the user is allowed to change the pitch type.
   * @platform ios
   */
  togglePitchEnabled?: boolean;
};

/**
 * The type of map to display.
 */
export enum MapType {
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

export type MapProperties = {
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
  mapType?: MapType;

  /**
   * If true, the user can select a location on the map to get more information.
   * @platform ios
   */
  selectionEnabled?: boolean;

  /**
   * The maximum zoom level for the map.
   * @platform android
   */
  maxZoomPreference?: number;

  /**
   * The minimum zoom level for the map.
   * @platform android
   */
  minZoomPreference?: number;
};

export enum MapColorScheme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  FOLLOW_SYSTEM = 'FOLLOW_SYSTEM',
}

export type MapProps = {
  ref?: Ref<MapViewType>;
  style?: StyleProp<ViewStyle>;

  /**
   * The initial camera position of the map.
   */
  cameraPosition?: CameraPosition;

  /**
   * The array of markers to display on the map.
   */
  markers?: Marker[];

  /**
   * The `MapUiSettings` to be used for UI-specific settings on the map.
   */
  uiSettings?: MapUiSettings;

  /**
   * The properties for the map.
   */
  properties?: MapProperties;

  /**
   * Defines the color scheme for the map.
   */
  colorScheme?: MapColorScheme;

  /**
   * User location, overrides default behavior.
   */
  userLocation?: UserLocation;

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
  onMarkerClick?: (event: Marker) => void;

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

export type SetCameraPositionConfig = CameraPosition & {
  /**
   * The duration of the animation in milliseconds.
   */
  duration?: number;
};

export type MapViewType = {
  /**
   * Update camera position.
   *
   * @param config New camera postion config.
   */
  setCameraPosition: (config?: SetCameraPositionConfig) => void;
};

export type StreetViewProps = {
  style?: StyleProp<ViewStyle>;

  position?: Coordinates;
  isPanningGesturesEnabled?: boolean;
  isStreetNamesEnabled?: boolean;
  isUserNavigationEnabled?: boolean;
  isZoomGesturesEnabled?: boolean;
};

export type GoogleMapsModule = {
  /**
   * Asks the user to grant permissions for location.
   * @return A promise that fulfills with an object of type [`PermissionResponse`](#permissionresponse).
   */
  requestPermissionsAsync(): Promise<PermissionResponse>;
  /**
   * Checks user's permissions for accessing location.
   * @return A promise that fulfills with an object of type [`PermissionResponse`](#permissionresponse).
   */
  getPermissionsAsync(): Promise<PermissionResponse>;
};
