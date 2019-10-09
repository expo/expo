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
  | 'systemBrightness';

export type PermissionResponse = {
  status: PermissionStatus;
  expires: PermissionExpiration;
  neverAskAgain: Boolean;
  permissions: PermissionMap;
};

export type PermissionMap = { [permissionType: string /* PermissionType */]: PermissionInfo };

export type PermissionInfo = {
  status: PermissionStatus;
  expires: PermissionExpiration;
  neverAskAgain: Boolean;
  ios?: PermissionDetailsLocationIOS;
  android?: PermissionDetailsLocationAndroid;
};

export enum PermissionStatus {
  UNDETERMINED = 'undetermined',
  GRANTED = 'granted',
  DENIED = 'denied',
}

export type PermissionExpiration = 'never' | number;

export type PermissionDetailsLocationIOS = {
  scope: 'whenInUse' | 'always';
};

export type PermissionDetailsLocationAndroid = {
  scope: 'fine' | 'coarse' | 'none';
};
