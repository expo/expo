"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.areDetentsValid = areDetentsValid;
exports.getStackAnimationType = getStackAnimationType;
exports.getStackPresentationType = getStackPresentationType;
function areDetentsValid(detents) {
    if (Array.isArray(detents)) {
        return (!!detents.length &&
            detents.every((detent, index, arr) => typeof detent === 'number' &&
                detent >= 0 &&
                detent <= 1 &&
                detent >= (arr[index - 1] ?? 0)));
    }
    return detents === 'fitToContents' || detents === undefined || detents === null;
}
function getStackAnimationType(config) {
    switch (config.animationType) {
        case 'fade':
            return 'fade';
        case 'none':
            return 'none';
        case 'slide':
        default:
            return 'slide_from_bottom';
    }
}
function getStackPresentationType(config) {
    if (process.env.EXPO_OS === 'android') {
        if (config.transparent) {
            return 'transparentModal';
        }
        switch (config.presentationStyle) {
            case 'fullScreen':
                return 'fullScreenModal';
            case 'overFullScreen':
                return 'transparentModal';
            case 'pageSheet':
                return 'pageSheet';
            case 'formSheet':
                return 'formSheet';
            default:
                return 'fullScreenModal';
        }
    }
    switch (config.presentationStyle) {
        case 'overFullScreen':
            return 'transparentModal';
        case 'pageSheet':
            return 'pageSheet';
        case 'formSheet':
            return 'formSheet';
        case 'fullScreen':
        default:
            if (config.transparent) {
                return 'transparentModal';
            }
            return 'fullScreenModal';
    }
}
//# sourceMappingURL=utils.js.map