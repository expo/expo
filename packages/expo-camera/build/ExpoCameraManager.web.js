import { UnavailabilityError } from 'expo-modules-core';
import { PermissionStatus, } from './Camera.types';
import * as WebBarcodeScanner from './web/WebBarcodeScanner';
import { canGetUserMedia, isBackCameraAvailableAsync, isFrontCameraAvailableAsync, } from './web/WebUserMediaManager';
function getUserMedia(constraints) {
    return navigator.mediaDevices.getUserMedia(constraints);
}
function permissionResponse(status) {
    return {
        status,
        expires: 'never',
        canAskAgain: true,
        granted: status === PermissionStatus.GRANTED,
    };
}
function handleGetUserMediaError(message) {
    if (message === 'Permission dismissed') {
        return permissionResponse(PermissionStatus.UNDETERMINED);
    }
    return permissionResponse(PermissionStatus.DENIED);
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
        return permissionResponse(PermissionStatus.GRANTED);
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
                return permissionResponse(PermissionStatus.UNDETERMINED);
            case 'granted':
                return permissionResponse(PermissionStatus.GRANTED);
            case 'denied':
                return permissionResponse(PermissionStatus.DENIED);
        }
    }
    catch (e) {
        // Firefox doesn't support querying for the camera permission, so return undetermined status
        if (e instanceof TypeError) {
            return permissionResponse(PermissionStatus.UNDETERMINED);
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
        return camera.takePicture(options);
    },
    async pausePreview(camera) {
        return camera.pausePreview();
    },
    async resumePreview(camera) {
        return camera.resumePreview();
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
        return camera.getAvailablePictureSizes(ratio);
    },
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
            await getUserMedia({ audio: true });
            return permissionResponse(PermissionStatus.GRANTED);
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