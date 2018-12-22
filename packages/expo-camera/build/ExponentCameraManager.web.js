import { FACING_MODES } from 'jslib-html5-camera-photo';
export default {
    get name() {
        return 'ExponentCameraManager';
    },
    get Type() {
        return {
            back: FACING_MODES.ENVIRONMENT,
            front: FACING_MODES.USER,
        };
    },
    get FlashMode() {
        return {
            on: 'on',
            off: 'off',
            auto: 'auto',
        };
    },
    get AutoFocus() {
        return {
            on: 'on',
            off: 'off',
            auto: 'auto',
        };
    },
    get WhiteBalance() {
        return {
            auto: 'auto',
        };
    },
    get VideoQuality() {
        return {};
    },
    async takePicture(options, camera) {
        const config = {
            ...options,
            imageCompression: options.quality || 0.92,
        };
        const dataUri = camera.getDataUri(config);
        const capturedPicture = {
            uri: dataUri,
            base64: dataUri,
            width: 0,
            height: 0,
            exif: undefined,
        };
        const cameraSettigs = camera.getCameraSettings();
        if (cameraSettigs) {
            const { height, width } = cameraSettigs;
            capturedPicture.width = width;
            capturedPicture.height = height;
            capturedPicture.exif = cameraSettigs;
        }
        if (options.onPictureSaved) {
            options.onPictureSaved(capturedPicture);
        }
        return capturedPicture;
    },
    async pausePreview(camera) {
        return await camera.stopCamera();
    },
    async resumePreview(camera) {
        if (!camera.__cameraFacingMode) {
            camera.__cameraFacingMode = FACING_MODES.USER;
        }
        return await camera.startCameraMaxResolution(camera.__cameraFacingMode);
    },
};
//# sourceMappingURL=ExponentCameraManager.web.js.map