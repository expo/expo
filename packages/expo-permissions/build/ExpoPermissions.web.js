import { PermissionStatus, } from './Permissions.types';
/*
 * TODO: Bacon: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Permissions
 * Add messages to manifest like we do with iOS info.plist
 */
// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Using_the_new_API_in_older_browsers
// Older browsers might not implement mediaDevices at all, so we set an empty object first
function _getUserMedia(constraints) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
    }
    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    // First get ahold of the legacy getUserMedia, if present
    const getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        function () {
            const error = new Error('Permission unimplemented');
            error.code = 0;
            error.name = 'NotAllowedError';
            throw error;
        };
    return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
    });
}
async function askForMediaPermissionAsync(options) {
    try {
        await _getUserMedia(options);
        return { status: PermissionStatus.GRANTED, expires: 'never' };
    }
    catch ({ message }) {
        // name: NotAllowedError
        // code: 0
        if (message === 'Permission dismissed') {
            // message: Permission dismissed
            return { status: PermissionStatus.UNDETERMINED, expires: 'never' };
        }
        else {
            // TODO: Bacon: [OSX] The system could deny access to chrome.
            // TODO: Bacon: add: { status: 'unimplemented' }
            // message: Permission denied
            return { status: PermissionStatus.DENIED, expires: 'never' };
        }
    }
}
async function askForMicrophonePermissionAsync() {
    return await askForMediaPermissionAsync({ audio: true });
}
async function askForCameraPermissionAsync() {
    return await askForMediaPermissionAsync({ video: true });
}
async function askForLocationPermissionAsync() {
    return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(() => resolve({ status: PermissionStatus.GRANTED, expires: 'never' }), ({ code }) => {
            // https://developer.mozilla.org/en-US/docs/Web/API/PositionError/code
            if (code === 1) {
                resolve({ status: PermissionStatus.DENIED, expires: 'never' });
            }
            else {
                resolve({ status: PermissionStatus.UNDETERMINED, expires: 'never' });
            }
        });
    });
}
async function getPermissionAsync(permission, shouldAsk) {
    switch (permission) {
        case 'userFacingNotifications':
        case 'notifications':
            {
                const { Notification = {} } = window;
                if (Notification.requestPermission) {
                    let status = Notification.permission;
                    if (shouldAsk) {
                        status = await Notification.requestPermission();
                    }
                    if (!status || status === 'default') {
                        return { status: PermissionStatus.UNDETERMINED, expires: 'never' };
                    }
                    return { status, expires: 'never' };
                }
            }
            break;
        case 'location':
            {
                const { navigator = {} } = window;
                if (navigator.permissions) {
                    const { state } = await navigator.permissions.query({ name: 'geolocation' });
                    if (state !== PermissionStatus.GRANTED && state !== PermissionStatus.DENIED) {
                        if (shouldAsk) {
                            return await askForLocationPermissionAsync();
                        }
                        return { status: PermissionStatus.UNDETERMINED, expires: 'never' };
                    }
                    return { status: state, expires: 'never' };
                }
                else if (shouldAsk) {
                    // TODO: Bacon: should this function as ask async when not in chrome?
                    return await askForLocationPermissionAsync();
                }
            }
            break;
        case 'audioRecording':
            if (shouldAsk) {
                return await askForMicrophonePermissionAsync();
            }
            else {
                //TODO: Bacon: Is it possible to get this permission?
            }
            break;
        case 'camera':
            if (shouldAsk) {
                return await askForCameraPermissionAsync();
            }
            else {
                //TODO: Bacon: Is it possible to get this permission?
            }
            break;
        default:
            break;
    }
    return { status: PermissionStatus.UNDETERMINED, expires: 'never' };
}
export default {
    get name() {
        return 'ExpoPermissions';
    },
    async getAsync(permissionTypes) {
        const results = {};
        for (const permissionType of new Set(permissionTypes)) {
            results[permissionType] = await getPermissionAsync(permissionType, /* shouldAsk */ false);
        }
        return results;
    },
    async askAsync(permissionTypes) {
        const results = {};
        for (const permissionType of new Set(permissionTypes)) {
            results[permissionType] = await getPermissionAsync(permissionType, /* shouldAsk */ true);
        }
        return results;
    },
};
//# sourceMappingURL=ExpoPermissions.web.js.map