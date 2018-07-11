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
type PermissionResponse = {
  status: PermissionStatus,
  expires: PermissionExpires,
  ios?: PermissionDetailsLocationIOS,
  android?: PermissionDetailsLocationAndroid,
};

export async function getAsync(type: PermissionType): Promise<PermissionResponse> {
  return Permissions.getAsync(type);
}

export async function askAsync(type: PermissionType): Promise<PermissionResponse> {
  return Permissions.askAsync(type);
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
