export declare type PermissionType = 'camera' | 'cameraRoll' | 'audioRecording' | 'location' | 'userFacingNotifications' | 'notifications' | 'contacts' | 'calendar' | 'reminders' | 'systemBrightness';
export declare type PermissionResponse = {
    status: PermissionStatus;
    expires: PermissionExpiration;
    permissions: PermissionMap;
};
export declare type PermissionMap = {
    [permissionType: string]: PermissionInfo;
};
export declare type PermissionInfo = {
    status: PermissionStatus;
    expires: PermissionExpiration;
    ios?: PermissionDetailsLocationIOS;
    android?: PermissionDetailsLocationAndroid;
};
export declare enum PermissionStatus {
    UNDETERMINED = "undetermined",
    GRANTED = "granted",
    DENIED = "denied"
}
export declare type PermissionExpiration = 'never' | number;
export declare type PermissionDetailsLocationIOS = {
    scope: 'whenInUse' | 'always';
};
export declare type PermissionDetailsLocationAndroid = {
    scope: 'fine' | 'coarse' | 'none';
};
