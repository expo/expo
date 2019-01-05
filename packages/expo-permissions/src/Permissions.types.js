// @flow

export type PermissionType =
  | 'audioRecording'
  | 'calendar'
  | 'camera'
  | 'cameraRoll'
  | 'contacts'
  | 'location'
  | 'notifications'
  | 'reminders'
  | 'systemBrightness'
  | 'userFacingNotifications';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export type PermissionExpires = 'never';

export type PermissionDetailsLocationIOS = {
  scope: 'whenInUse' | 'always',
};

export type PermissionDetailsLocationAndroid = {
  scope: 'fine' | 'coarse' | 'none',
};

export type SimpleResponse = {
  status: PermissionStatus,
  expires: PermissionExpires,
  ios?: PermissionDetailsLocationIOS,
  android?: PermissionDetailsLocationAndroid,
};

export type PermissionsResponse = {
  status: PermissionStatus,
  expires: PermissionExpires,
  permissions: { [key: PermissionType]: SimpleResponse },
};
