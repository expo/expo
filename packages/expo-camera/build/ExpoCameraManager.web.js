import { UnavailabilityError } from 'expo-modules-core';
import { CameraType, PermissionStatus, } from './Camera.types';
import { canGetUserMedia, isBackCameraAvailableAsync, isFrontCameraAvailableAsync, } from './WebUserMediaManager';
function getUserMedia(constraints) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
    }
    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    // First get ahold of the legacy getUserMedia, if present
    const getUserMedia = 
    // TODO: this method is deprecated, migrate to https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    navigator.getUserMedia ||
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
function handleGetUserMediaError({ message }) {
    // name: NotAllowedError
    // code: 0
    if (message === 'Permission dismissed') {
        return {
            status: PermissionStatus.UNDETERMINED,
            expires: 'never',
            canAskAgain: true,
            granted: false,
        };
    }
    else {
        // TODO: Bacon: [OSX] The system could deny access to chrome.
        // TODO: Bacon: add: { status: 'unimplemented' }
        return {
            status: PermissionStatus.DENIED,
            expires: 'never',
            canAskAgain: true,
            granted: false,
        };
    }
}
async function handleRequestPermissionsAsync() {
    try {
        await getUserMedia({
            video: true,
        });
        return {
            status: PermissionStatus.GRANTED,
            expires: 'never',
            canAskAgain: true,
            granted: true,
        };
    }
    catch ({ message }) {
        return handleGetUserMediaError({ message });
    }
}
async function handlePermissionsQueryAsync(query) {
    if (!navigator?.permissions?.query) {
        throw new UnavailabilityError('expo-camera', 'navigator.permissions API is not available');
    }
    try {
        const { state } = await navigator.permissions.query({ name: query });
        switch (state) {
            case 'prompt':
                return {
                    status: PermissionStatus.UNDETERMINED,
                    expires: 'never',
                    canAskAgain: true,
                    granted: false,
                };
            case 'granted':
                return {
                    status: PermissionStatus.GRANTED,
                    expires: 'never',
                    canAskAgain: true,
                    granted: true,
                };
            case 'denied':
                return {
                    status: PermissionStatus.DENIED,
                    expires: 'never',
                    canAskAgain: true,
                    granted: false,
                };
        }
    }
    catch (e) {
        // Firefox doesn't support querying for the camera permission, so return undetermined status
        if (e instanceof TypeError) {
            return {
                status: PermissionStatus.UNDETERMINED,
                expires: 'never',
                canAskAgain: true,
                granted: false,
            };
        }
        throw e;
    }
}
export default {
    get name() {
        return 'ExponentCameraManager';
    },
    get Type() {
        return {
            back: 'back',
            front: 'front',
        };
    },
    get FlashMode() {
        return {
            on: 'on',
            off: 'off',
            auto: 'auto',
            torch: 'torch',
        };
    },
    get AutoFocus() {
        return {
            on: 'on',
            off: 'off',
            auto: 'auto',
            singleShot: 'singleShot',
        };
    },
    get WhiteBalance() {
        return {
            auto: 'auto',
            continuous: 'continuous',
            manual: 'manual',
        };
    },
    get VideoQuality() {
        return {};
    },
    get VideoStabilization() {
        return {};
    },
    async isAvailableAsync() {
        return canGetUserMedia();
    },
    async takePicture(options, camera) {
        return await camera.takePicture(options);
    },
    async pausePreview(camera) {
        await camera.pausePreview();
    },
    async resumePreview(camera) {
        return await camera.resumePreview();
    },
    async getAvailableCameraTypesAsync() {
        if (!canGetUserMedia() || !navigator.mediaDevices.enumerateDevices)
            return [];
        const devices = await navigator.mediaDevices.enumerateDevices();
        const types = await Promise.all([
            (await isFrontCameraAvailableAsync(devices)) && CameraType.front,
            (await isBackCameraAvailableAsync()) && CameraType.back,
        ]);
        return types.filter(Boolean);
    },
    async getAvailablePictureSizes(ratio, camera) {
        return await camera.getAvailablePictureSizes(ratio);
    },
    /* async getSupportedRatios(camera: ExponentCameraRef): Promise<string[]> {
      // TODO: Support on web
    },
    async record(
      options?: CameraRecordingOptions,
      camera: ExponentCameraRef
    ): Promise<{ uri: string }> {
      // TODO: Support on web
    },
    async stopRecording(camera: ExponentCameraRef): Promise<void> {
      // TODO: Support on web
    }, */
    async getPermissionsAsync() {
        return handlePermissionsQueryAsync('camera');
    },
    async requestPermissionsAsync() {
        return handleRequestPermissionsAsync();
    },
    async getCameraPermissionsAsync() {
        return handlePermissionsQueryAsync('camera');
    },
    async requestCameraPermissionsAsync() {
        return handleRequestPermissionsAsync();
    },
    async getMicrophonePermissionsAsync() {
        return handlePermissionsQueryAsync('microphone');
    },
    async requestMicrophonePermissionsAsync() {
        try {
            await getUserMedia({
                audio: true,
            });
            return {
                status: PermissionStatus.GRANTED,
                expires: 'never',
                canAskAgain: true,
                granted: true,
            };
        }
        catch ({ message }) {
            return handleGetUserMediaError({ message });
        }
    },
};
//# sourceMappingURL=ExpoCameraManager.web.js.map