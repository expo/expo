import type { SharedRef as SharedRefType } from 'expo/types';
import type { StyleProp, ViewStyle } from 'react-native';

export type Coordinates = {
  /**
   * The latitude of the coordinate.
   */
  latitude?: number;
  /**
   * The longitude of the coordinate.
   */
  longitude?: number;
};

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
   * The maximum zoom level for the map.
   */
  maxZoomPreference?: number;

  /**
   * The minimum zoom level for the map.
   */
  minZoomPreference?: number;
};

export enum MapColorScheme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  FOLLOW_SYSTEM = 'FOLLOW_SYSTEM',
}

export type ExpoMapsProps = {
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
   * Lambda invoked when the map is clicked
   */
  onMapClick?: (event: { coordinates: Coordinates }) => void;

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
