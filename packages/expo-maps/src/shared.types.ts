import type { PermissionResponse } from 'expo';

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

export type CameraPosition = {
  /**
   * The middle point of the camera.
   */
  coordinates?: Coordinates;

  /**
   * The zoom level of the camera.
   * For some view sizes, lower zoom levels might not be available.
   */
  zoom?: number;
};

/**
 * The event payload for the `onCameraMove` callback on `AppleMaps.View` and `GoogleMaps.View`.
 */
export type CameraMoveEvent = {
  /**
   * The coordinates of the camera center.
   */
  coordinates: Coordinates;

  /**
   * The zoom level of the camera.
   */
  zoom: number;

  /**
   * The tilt of the camera in degrees.
   */
  tilt: number;

  /**
   * The bearing of the camera in degrees.
   */
  bearing: number;

  /**
   * The height of the visible region in degrees of latitude
   */
  latitudeDelta: number;

  /**
   * The width of the visible region in degrees of longitude
   */
  longitudeDelta: number;
};

/**
 * @hidden
 */
export type MapsModule = {
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
