import { PermissionStatus } from 'expo';
const noPermissionResponse = {
    status: PermissionStatus.UNDETERMINED,
    canAskAgain: true,
    granted: false,
    expires: 'never',
};
export default {
    async requestCalendarPermissionsAsync() {
        return noPermissionResponse;
    },
    async getCalendarPermissionsAsync() {
        return noPermissionResponse;
    },
    async getRemindersPermissionsAsync() {
        return noPermissionResponse;
    },
    async requestRemindersPermissionsAsync() {
        return noPermissionResponse;
    },
};
//# sourceMappingURL=ExpoCalendar.web.js.map