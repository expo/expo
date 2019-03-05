import { PermissionStatus } from 'expo-permissions/src/Permissions.types';
export declare function requestPermissionAsync(): Promise<{
    status: PermissionStatus;
}>;
export declare function getPermissionAsync(): Promise<{
    status: PermissionStatus;
}>;
