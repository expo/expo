import type { SharedRef as SharedRefType } from 'expo/types';
import type { StyleProp, ViewStyle } from 'react-native';

import { CameraPosition, Coordinates } from '../shared.types';

export type AppleMapsMarker = {
  /**
   * The SF Symbol to display for the marker.
   */
  systemImage?: string;

  /**
   * The coordinates of the marker.
   */
  coordinates?: Coordinates;

  /**
   * The title of the marker, displayed in the callout when the marker is clicked.
   */
  title?: string;

  /**
   * The tint color of the marker.
   */
  tintColor?: string;
};

export type AppleMapsUISettings = {
  /**
   * Whether the compass is enabled on the map.
   * If enabled, the compass is only visible when the map is rotated.
   */
  compassEnabled?: boolean;

  /**
   * Whether the my location button is visible.
   */
  myLocationButtonEnabled?: boolean;

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
 */
export enum AppleMapsType {
  /**
   * Satellite imagery with roads and points of interest overlayed.
   */
  HYBRID = 'HYBRID',
  /**
   * Standard road map.
   */
  STANDARD = 'STANDARD',
  /**
   * Satellite imagery.
   */
  IMAGERY = 'IMAGERY',
}

export type AppleMapsProperties = {
  /**
   * Whether the traffic layer is enabled on the map.
   */
  isTrafficEnabled?: boolean;

  /**
   * Defines which map type should be used.
   */
  mapType?: AppleMapsType;

  /**
   * If true, the user can select a location on the map to get more information.
   */
  selectionEnabled?: boolean;
};

export type AppleMapsAnnotation = {
  /**
   * The background color of the annotation.
   */
  backgroundColor?: string;
  /**
   * The text to display in the annotation.
   */
  text?: string;
  /**
   * The text color of the annotation.
   */
  textColor?: string;
  /**
   * The custom icon to display in the annotation.
   */
  icon?: SharedRefType<'image'>;
} & AppleMapsMarker;

export type AppleMapsViewProps = {
  style?: StyleProp<ViewStyle>;

  /**
   * The initial camera position of the map.
   */
  cameraPosition?: CameraPosition;

  /**
   * The array of markers to display on the map.
   */
  markers?: AppleMapsMarker[];

  /**
   * The array of annotations to display on the map.
   */
  annotations?: AppleMapsAnnotation[];

  /**
   * The `MapUiSettings` to be used for UI-specific settings on the map.
   */
  uiSettings?: AppleMapsUISettings;

  /**
   * The properties for the map.
   */
  properties?: AppleMapsProperties;

  /**
   * Lambda invoked when the user clicks on the map.
   * It won't be invoked if the user clicks on POI or a marker.
   */
  onMapClick?: (event: { coordinates: Coordinates }) => void;

  /**
   * Lambda invoked when the marker is clicked
   */
  onMarkerClick?: (event: AppleMapsMarker) => void;

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
