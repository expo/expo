import { PermissionResponse as EXPermissionResponse, PermissionStatus, PermissionExpiration } from 'expo-modules-core';
export type PermissionType = 'camera' | 'cameraRoll' | 'mediaLibrary' | 'mediaLibraryWriteOnly' | 'audioRecording' | 'location' | 'locationForeground' | 'locationBackground' | 'userFacingNotifications' | 'notifications' | 'contacts' | 'calendar' | 'reminders' | 'motion' | 'systemBrightness';
export interface PermissionResponse extends EXPermissionResponse {
    permissions: PermissionMap;
}
export interface PermissionMap {
    [permissionType: string]: PermissionInfo;
}
export interface PermissionInfo extends EXPermissionResponse {
    /**
     * iOS only - Permission.MEDIA_LIBRARY/MEDIA_LIBRARY_WRITE_ONLY
     */
    accessPrivileges?: 'all' | 'limited' | 'none';
    scope?: 'whenInUse' | 'always' | 'none';
    android?: PermissionDetailsLocationAndroid;
}
export { PermissionStatus };
export { PermissionExpiration };
export type PermissionDetailsLocationAndroid = {
    accuracy: 'fine' | 'coarse' | 'none';
};
//# sourceMappingURL=Permissions.types.d.ts.map