import { UnavailabilityError } from 'expo-modules-core';
import { PermissionStatus, } from './Camera.types';
import * as WebBarcodeScanner from './web/WebBarcodeScanner';
import { canGetUserMedia, isBackCameraAvailableAsync, isFrontCameraAvailableAsync, } from './web/WebUserMediaManager';
function getUserMedia(constraints) {
    return navigator.mediaDevices.getUserMedia(constraints);
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
        const streams = await getUserMedia({
            video: true,
        });
        // We need to close the media stream returned by getUserMedia
        // to avoid using the camera since we won't use these streams now
        // https://developer.mozilla.org/fr/docs/Web/API/MediaDevices/getUserMedia
        streams.getTracks().forEach((track) => {
            track.stop();
            streams.removeTrack(track);
        });
        return {
            status: PermissionStatus.GRANTED,
            expires: 'never',
            canAskAgain: true,
            granted: true,
        };
    }
    catch (error) {
        return handleGetUserMediaError(error.message);
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
    isModernBarcodeScannerAvailable: false,
    toggleRecordingAsyncAvailable: false,
    addListener(_eventName, _listener) {
        return { remove: () => { } };
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
            screen: 'on',
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
            (await isFrontCameraAvailableAsync(devices)) && 'front',
            (await isBackCameraAvailableAsync()) && 'back',
        ]);
        return types.filter(Boolean);
    },
    async getAvailablePictureSizes(ratio, camera) {
        return await camera.getAvailablePictureSizes(ratio);
    },
    /*
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
        catch (error) {
            return handleGetUserMediaError(error.message);
        }
    },
    async scanFromURLAsync(url, barcodeTypes) {
        const response = await fetch(url);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        const types = barcodeTypes && barcodeTypes.length > 0 ? barcodeTypes : WebBarcodeScanner.ALL_BARCODE_TYPES;
        const results = await WebBarcodeScanner.detect(bitmap, types);
        bitmap.close();
        return results;
    },
};
//# sourceMappingURL=ExpoCameraManager.web.js.map