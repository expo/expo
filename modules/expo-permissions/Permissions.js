// @flow
import { Platform } from 'react-native';
import { NativeModulesProxy } from 'expo-core';

const { ExponentPermissions: Permissions } = NativeModulesProxy;

type PermissionType =
  | 'audioRecording'
  | 'calendar'
  | 'camera'
  | 'cameraRoll'
  | 'contacts'
  | 'location'
  | 'notifications'
  | 'reminders'
  | 'systemBrightness'
  | 'userFacingNotifications'
  | 'SMS';
type PermissionStatus = 'undetermined' | 'granted' | 'denied';
type PermissionExpires = 'never';
type PermissionDetailsLocationIOS = {
  scope: 'whenInUse' | 'always',
};
type PermissionDetailsLocationAndroid = {
  scope: 'fine' | 'coarse' | 'none',
};
type SimpleResponse = {
  status: PermissionStatus,
  expires: PermissionExpires,
  ios?: PermissionDetailsLocationIOS,
  android?: PermissionDetailsLocationAndroid,
};
type PermissionsResponse = {
  status: PermissionStatus,
  expires: PermissionExpires,
  permissions: { [key: PermissionType]: SimpleResponse },
}

async function handlePermissionsRequest(
  types: Array<PermissionType>,
  handlePermissions: (Array<PermissionType>) => Promise<{ [key: PermissionType]: SimpleResponse }>
): Promise<PermissionsResponse> {
  if (!types.length) {
    throw new Error('No permission requested!');
  }
  const permissions = await handlePermissions(types);
  return {
    status: Object.keys(permissions).reduce((acc, key) => permissions[key].status !== 'granted' ? permissions[key].status : acc, 'granted'),
    expires: Object.keys(permissions).reduce((acc, key) => permissions[key].expires !== 'never' ? permissions[key].expires : acc, 'never'),
    permissions,
  };
}

export async function getAsync(...types: Array<PermissionType>): Promise<PermissionsResponse> {
  return handlePermissionsRequest(types, Permissions.getAsync)
}

export async function askAsync(...types: Array<PermissionType>): Promise<PermissionsResponse> {
  return handlePermissionsRequest(types, Permissions.askAsync);
}

export const CAMERA = 'camera';
export const AUDIO_RECORDING = 'audioRecording';
export const LOCATION = 'location';
export const USER_FACING_NOTIFICATIONS = 'userFacingNotifications';
export const NOTIFICATIONS = 'notifications';
export const CONTACTS = 'contacts';
export const SYSTEM_BRIGHTNESS = 'systemBrightness';
export const CAMERA_ROLL = 'cameraRoll';
export const CALENDAR = 'calendar';
export const REMINDERS = 'reminders';
export const SMS = 'SMS';
