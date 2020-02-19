import { Platform } from '@unimodules/core';
import NotificationPermissionsModule from './NotificationPermissionsModule';
export { AndroidImportance, AndroidInterruptionFilter, IosAlertStyle, IosAllowsPreviews, IosAuthorizationStatus, } from './NotificationPermissionsModule';
export async function getPermissionsAsync() {
    return await NotificationPermissionsModule.getPermissionsAsync();
}
export async function requestPermissionsAsync(permissions) {
    const requestedPermissions = permissions ?? {
        ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
        },
    };
    const requestedPlatformPermissions = requestedPermissions[Platform.OS];
    return await NotificationPermissionsModule.requestPermissionsAsync(requestedPlatformPermissions);
}
//# sourceMappingURL=NotificationPermissions.js.map