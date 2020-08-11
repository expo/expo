import { PermissionStatus } from 'unimodules-permissions-interface';
const noPermissionResponse = {
    status: PermissionStatus.UNDETERMINED,
    canAskAgain: true,
    granted: false,
    expires: 'never',
};
export default {
    get name() {
        return 'ExponentMediaLibrary';
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
    async getPermissionsAsync() {
        return noPermissionResponse;
    },
    async requestPermissionsAsync() {
        return noPermissionResponse;
    },
};
//# sourceMappingURL=ExponentMediaLibrary.web.js.map