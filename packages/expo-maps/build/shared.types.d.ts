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
//# sourceMappingURL=shared.types.d.ts.map