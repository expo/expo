import { NotificationPermissionsRequest } from './NotificationPermissions.types';
export declare function getPermissionsAsync(): Promise<import("./NotificationPermissions.types").NotificationPermissionsStatus>;
export declare function requestPermissionsAsync(permissions?: NotificationPermissionsRequest): Promise<import("./NotificationPermissions.types").NotificationPermissionsStatus>;
