import { PermissionResponse as UMPermissionResponse, PermissionStatus, PermissionExpiration } from 'unimodules-permissions-interface';
export declare type PermissionType = 'camera' | 'cameraRoll' | 'audioRecording' | 'location' | 'userFacingNotifications' | 'notifications' | 'contacts' | 'calendar' | 'reminders' | 'motion' | 'systemBrightness';
export interface PermissionResponse extends UMPermissionResponse {
    permissions: PermissionMap;
}
export interface PermissionMap {
    [permissionType: string]: PermissionInfo;
}
export interface PermissionInfo extends UMPermissionResponse {
    accessPrivileges?: 'all' | 'limited' | 'none';
    scope?: 'whenInUse' | 'always' | 'none';
    android?: PermissionDetailsLocationAndroid;
}
export { PermissionStatus };
export { PermissionExpiration };
export declare type PermissionDetailsLocationAndroid = {
    accuracy: 'fine' | 'coarse' | 'none';
};
