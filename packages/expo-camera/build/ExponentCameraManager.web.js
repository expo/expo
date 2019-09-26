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
    // TODO: Bacon: Is video possible?
    // record(options): Promise
    // stopRecording(): Promise<void>
    async takePicture(options, camera) {
        return await camera.takePicture(options);
    },
    async pausePreview(camera) {
        camera.pausePreview();
    },
    async resumePreview(camera) {
        return await camera.resumePreview();
    },
    async getAvailablePictureSizes(ratio, camera) {
        return await camera.getAvailablePictureSizes(ratio);
    },
};
//# sourceMappingURL=ExponentCameraManager.web.js.map