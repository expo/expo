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
  ios?: PermissionDetailsLocationIOS;
  android?: PermissionDetailsLocationAndroid;
}

export { PermissionStatus };

export { PermissionExpiration };

export type PermissionDetailsLocationIOS = {
  scope: 'whenInUse' | 'always';
};

export type PermissionDetailsLocationAndroid = {
  scope: 'fine' | 'coarse' | 'none';
};
