import { Platform } from 'react-native';
import { coalesceExpirations, coalesceStatuses, coalesceCanAskAgain, coalesceGranted, } from './CoalescedPermissions';
import Permissions from './ExpoPermissions';
import { PermissionStatus, } from './Permissions.types';
export { PermissionStatus, };
export const CAMERA = 'camera';
export const MEDIA_LIBRARY = 'mediaLibrary';
export const MEDIA_LIBRARY_WRITE_ONLY = 'mediaLibraryWriteOnly';
/**
 * @deprecated Use `MEDIA_LIBRARY` or `MEDIA_LIBRARY_WRITE_ONLY`
 */
export const CAMERA_ROLL = MEDIA_LIBRARY;
export const AUDIO_RECORDING = 'audioRecording';
/** @deprecated Use `LOCATION_FOREGROUND` or `LOCATION_BACKGROUND` instead */
export const LOCATION = 'location';
export const LOCATION_FOREGROUND = 'locationForeground';
export const LOCATION_BACKGROUND = 'locationBackground';
export const USER_FACING_NOTIFICATIONS = 'userFacingNotifications';
export const NOTIFICATIONS = 'notifications';
export const CONTACTS = 'contacts';
export const CALENDAR = 'calendar';
export const REMINDERS = 'reminders';
export const SYSTEM_BRIGHTNESS = 'systemBrightness';
export const MOTION = 'motion';
// Map corresponding permission to correct package
const PERMISSION_MODULE_MAPPING = {
    [CAMERA]: 'expo-camera',
    [MEDIA_LIBRARY]: 'expo-media-library',
    [MEDIA_LIBRARY_WRITE_ONLY]: 'expo-media-library',
    [AUDIO_RECORDING]: 'expo-av',
    [LOCATION]: 'expo-location',
    [USER_FACING_NOTIFICATIONS]: 'expo-notifications',
    [NOTIFICATIONS]: 'expo-notifications',
    [CONTACTS]: 'expo-contacts',
    [CALENDAR]: 'expo-calendar',
    [REMINDERS]: 'expo-calendar',
    [SYSTEM_BRIGHTNESS]: 'expo-brightness',
    [MOTION]: 'expo-sensors',
};
export async function getAsync(...types) {
    console.warn(`expo-permissions is now deprecated — the functionality has been moved to other expo packages that directly use these permissions (e.g. expo-location, expo-camera). The package will be removed in the upcoming releases.`);
    if (Platform.OS === 'ios') {
        return await _handleMultiPermissionsRequestIOSAsync(types, Permissions.getAsync);
    }
    return await _handlePermissionsRequestAsync(types, Permissions.getAsync);
}
export async function askAsync(...types) {
    console.warn(`expo-permissions is now deprecated — the functionality has been moved to other expo packages that directly use these permissions (e.g. expo-location, expo-camera). The package will be removed in the upcoming releases.`);
    if (Platform.OS === 'ios') {
        return await _handleMultiPermissionsRequestIOSAsync(types, Permissions.askAsync);
    }
    return await _handlePermissionsRequestAsync(types, Permissions.askAsync);
}
async function _handleSinglePermissionRequestIOSAsync(type, handlePermission) {
    if (Platform.OS !== 'web' && type === 'motion') {
        return {
            status: PermissionStatus.GRANTED,
            expires: 'never',
            granted: true,
            canAskAgain: true,
        };
    }
    try {
        return await handlePermission(type);
    }
    catch (error) {
        // We recognize the permission's library, so we inform the user to link that library to request the permission.
        if (error.code === 'E_PERMISSIONS_UNKNOWN' && PERMISSION_MODULE_MAPPING[type]) {
            const library = PERMISSION_MODULE_MAPPING[type];
            error.message = `${error.message}, please install and link the package ${PERMISSION_MODULE_MAPPING[type]}, see more at https://github.com/expo/expo/tree/main/packages/${library}`;
        }
        throw error;
    }
}
async function _handleMultiPermissionsRequestIOSAsync(types, handlePermission) {
    if (!types.length) {
        throw new Error('At least one permission type must be specified');
    }
    const permissions = {};
    for (const type of types) {
        permissions[type] = await _handleSinglePermissionRequestIOSAsync(type, handlePermission);
    }
    return {
        status: coalesceStatuses(permissions),
        expires: coalesceExpirations(permissions),
        canAskAgain: coalesceCanAskAgain(permissions),
        granted: coalesceGranted(permissions),
        permissions,
    };
}
async function _handlePermissionsRequestAsync(types, handlePermissions) {
    if (!types.length) {
        throw new Error('At least one permission type must be specified');
    }
    if (Platform.OS !== 'web' && types.length === 1 && types[0] === 'motion') {
        const approvedPermission = {
            status: PermissionStatus.GRANTED,
            expires: 'never',
            granted: true,
            canAskAgain: true,
        };
        return {
            ...approvedPermission,
            // @ts-ignore
            permissions: { motion: approvedPermission },
        };
    }
    const permissions = await handlePermissions(types);
    return {
        status: coalesceStatuses(permissions),
        expires: coalesceExpirations(permissions),
        canAskAgain: coalesceCanAskAgain(permissions),
        granted: coalesceGranted(permissions),
        permissions,
    };
}
//# sourceMappingURL=Permissions.js.map