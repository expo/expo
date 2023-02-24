import { PermissionStatus } from 'expo-modules-core';
const noPermissionResponse = {
    status: PermissionStatus.UNDETERMINED,
    canAskAgain: true,
    granted: false,
    expires: 'never',
};
export default {
    get name() {
        return 'ExpoMediaLibrary';
    },
    get CHANGE_LISTENER_NAME() {
        return 'mediaLibraryDidChange';
    },
    get MediaType() {
        return {
            audio: 'audio',
            photo: 'photo',
            video: 'video',
            unknown: 'unknown',
        };
    },
    get SortBy() {
        return {
            default: 'default',
            mediaType: 'mediaType',
            width: 'width',
            height: 'height',
            creationTime: 'creationTime',
            modificationTime: 'modificationTime',
            duration: 'duration',
        };
    },
    async getPermissionsAsync(_writeOnly) {
        return noPermissionResponse;
    },
    async requestPermissionsAsync(_writeOnly) {
        return noPermissionResponse;
    },
};
//# sourceMappingURL=ExpoMediaLibrary.web.js.map