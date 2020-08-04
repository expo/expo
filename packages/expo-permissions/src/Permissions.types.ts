import {
  PermissionResponse as UMPermissionResponse,
  PermissionStatus,
  PermissionExpiration,
} from 'unimodules-permissions-interface';

export type PermissionType =
  | 'camera'
  | 'cameraRoll'
  | 'audioRecording'
  | 'location'
  | 'userFacingNotifications'
  | 'notifications'
  | 'contacts'
  | 'calendar'
  | 'reminders'
  | 'motion'
  | 'systemBrightness';

export interface PermissionResponse extends UMPermissionResponse {
  permissions: PermissionMap;
}

export interface PermissionMap {
  [permissionType: string /* PermissionType */]: PermissionInfo;
}

export interface PermissionInfo extends UMPermissionResponse {
  // iOS only - Permission.CAMERA_ROLL
  accessPrivileges?: 'all' | 'limited' | 'none';
  scope?: 'whenInUse' | 'always' | 'none';
  android?: PermissionDetailsLocationAndroid;
}

export { PermissionStatus };

export { PermissionExpiration };

export type PermissionDetailsLocationAndroid = {
  accuracy: 'fine' | 'coarse' | 'none';
};
