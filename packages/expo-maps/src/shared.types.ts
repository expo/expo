import { PermissionResponse } from 'expo-modules-core';

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
