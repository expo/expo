import { Platform, UnavailabilityError } from '@unimodules/core';
import NotificationPermissionsModule from './NotificationPermissionsModule';
export async function getPermissionsAsync() {
    if (!NotificationPermissionsModule.getPermissionsAsync) {
        throw new UnavailabilityError('Notifications', 'getPermissionsAsync');
    }
    return await NotificationPermissionsModule.getPermissionsAsync();
}
export async function requestPermissionsAsync(permissions) {
    if (!NotificationPermissionsModule.requestPermissionsAsync) {
        throw new UnavailabilityError('Notifications', 'requestPermissionsAsync');
    }
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