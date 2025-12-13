import { PermissionStatus } from 'expo-modules-core';
const webPermissionsResponse = {
    status: PermissionStatus.GRANTED,
    expires: 'never',
    granted: true,
    canAskAgain: true,
};
export default {
    async getPermissionsAsync() {
        return webPermissionsResponse;
    },
    async requestPermissionsAsync() {
        return webPermissionsResponse;
    },
};
//# sourceMappingURL=ExpoTrackingTransparency.web.js.map