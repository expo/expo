import { PermissionStatus } from 'expo-modules-core';
const noPermissionResponse = {
    status: PermissionStatus.DENIED,
    canAskAgain: false,
    granted: false,
    expires: 'never',
};
export default {
    getAdvertisingId() {
        console.warn('TrackingTransparency.getAdvertisingId: Advertising ID is not supported on web platform');
        return '00000000-0000-0000-0000-000000000000';
    },
    async requestPermissionsAsync() {
        console.warn('TrackingTransparency.requestPermissionsAsync: App tracking permissions are not supported on web platform');
        return noPermissionResponse;
    },
    async getPermissionsAsync() {
        console.warn('TrackingTransparency.getPermissionsAsync: App tracking permissions are not supported on web platform');
        return noPermissionResponse;
    },
};
//# sourceMappingURL=ExpoTrackingTransparency.web.js.map