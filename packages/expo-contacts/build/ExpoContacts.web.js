import { PermissionStatus } from 'expo-modules-core';
const noPermissionResponse = {
    status: PermissionStatus.UNDETERMINED,
    canAskAgain: true,
    granted: false,
    expires: 'never',
};
export default {
    get name() {
        return 'ExpoContacts';
    },
    async getPermissionsAsync() {
        return noPermissionResponse;
    },
    async requestPermissionsAsync() {
        return noPermissionResponse;
    },
};
//# sourceMappingURL=ExpoContacts.web.js.map