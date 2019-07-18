import { coalesceExpirations, coalesceStatuses } from './CoalescedPermissions';
import Permissions from './ExpoPermissions';
import { Platform } from 'react-native';

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
  return await _handleMultiPermissionsRequestAsync(types, Permissions.getAsync);
}

export async function askAsync(...types: PermissionType[]): Promise<PermissionResponse> {
  return await _handleMultiPermissionsRequestAsync(types, Permissions.askAsync);
}

async function _handleSinglePermissionRequestAsync(
  type: PermissionType,
  handlePermission: (type: PermissionType) => Promise<PermissionInfo>
): Promise<PermissionInfo> {
  return handlePermission(type);
}

async function _handleMultiPermissionsRequestAsync(
  types: PermissionType[],
  handlePermission: (type: PermissionType) => Promise<PermissionInfo>
): Promise<any> {
  if (!types.length) {
    throw new Error('At least one permission type must be specified');
  }

  return await Promise.all(
    types.map(async type => ({
      [type]: await _handleSinglePermissionRequestAsync(type, handlePermission),
    }))
  )
    .then(permissions =>
      permissions.reduce((permission, acc) => {
        return { ...acc, ...permission };
      }, {})
    )
    .then(permissions => {
      return {
        status: coalesceStatuses(permissions),
        expires: coalesceExpirations(permissions),
        permissions: { ...permissions },
      };
    });
}
