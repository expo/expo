import ExponentAV from './ExponentAV';
export default {
    get name() {
        return 'ExpoVideoManager';
    },
    get ScaleNone() {
        return 'none';
    },
    get ScaleToFill() {
        return 'fill';
    },
    get ScaleAspectFit() {
        return 'contain';
    },
    get ScaleAspectFill() {
        return 'cover';
    },
    async setFullscreen(element, isFullScreenEnabled) {
        if (isFullScreenEnabled) {
            await element.requestFullscreen();
        }
        else {
            await document.exitFullscreen();
        }
        return ExponentAV.getStatusForVideo(element);
    },
};
//# sourceMappingURL=ExpoVideoManager.web.js.map