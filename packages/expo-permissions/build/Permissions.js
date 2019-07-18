import { coalesceExpirations, coalesceStatuses } from './CoalescedPermissions';
import Permissions from './ExpoPermissions';
import { PermissionStatus, } from './Permissions.types';
export { PermissionStatus, };
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
export async function getAsync(...types) {
    return await _handleMultiPermissionsRequestAsync(types, Permissions.getAsync);
}
export async function askAsync(...types) {
    return await _handleMultiPermissionsRequestAsync(types, Permissions.askAsync);
}
async function _handleSinglePermissionRequestAsync(type, handlePermission) {
    return handlePermission(type);
}
async function _handleMultiPermissionsRequestAsync(types, handlePermission) {
    if (!types.length) {
        throw new Error('At least one permission type must be specified');
    }
    return await Promise.all(types.map(async (type) => ({
        [type]: await _handleSinglePermissionRequestAsync(type, handlePermission),
    })))
        .then(permissions => permissions.reduce((permission, acc) => {
        return { ...acc, ...permission };
    }, {}))
        .then(permissions => {
        return {
            status: coalesceStatuses(permissions),
            expires: coalesceExpirations(permissions),
            permissions: { ...permissions },
        };
    });
}
//# sourceMappingURL=Permissions.js.map