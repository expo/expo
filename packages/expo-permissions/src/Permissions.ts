import { coalesceExpirations, coalesceStatuses } from './CoalescedPermissions';
import Permissions from './ExpoPermissions';
import {
  PermissionResponse,
  PermissionType,
  PermissionMap,
  PermissionStatus,
  PermissionExpiration,
  PermissionInfo,
} from './Permissions.types';

export {
  PermissionStatus,
  PermissionResponse,
  PermissionExpiration,
  PermissionMap,
  PermissionInfo,
  PermissionType,
};

export const CAMERA = 'camera';
export const CAMERA_ROLL = 'cameraRoll';
export const AUDIO_RECORDING = 'audioRecording';
export const LOCATION = 'location';
export const USER_FACING_NOTIFICATIONS = 'userFacingNotifications';
export const NOTIFICATIONS = 'notifications';
export const CONTACTS = 'contacts';
export const CALENDAR = 'calendar';
export const REMINDERS = 'reminders';
export const SYSTEM_BRIGHTNESS = 'systemBrightness';

export async function getAsync(...types: PermissionType[]): Promise<PermissionResponse> {
  return await _handlePermissionsRequestAsync(types, Permissions.getAsync);
}

export async function askAsync(...types: PermissionType[]): Promise<PermissionResponse> {
  return await _handlePermissionsRequestAsync(types, Permissions.askAsync);
}

async function _handlePermissionsRequestAsync(
  types: PermissionType[],
  handlePermissions: (types: PermissionType[]) => Promise<PermissionMap>
): Promise<PermissionResponse> {
  if (!types.length) {
    throw new Error('At least one permission type must be specified');
  }

  const permissions = await handlePermissions(types);
  return {
    status: coalesceStatuses(permissions),
    expires: coalesceExpirations(permissions),
    permissions,
  };
}
