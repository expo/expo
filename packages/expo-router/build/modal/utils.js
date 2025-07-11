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
    switch (config.presentationStyle) {
        case 'pageSheet':
            if (process.env.EXPO_OS === 'android') {
                // Using transparentModal in order to prevent the bottom screen from being unmounted.
                // Otherwise, the portal content would be unmounted as well.
                return 'transparentModal';
            }
            return 'pageSheet';
        case 'formSheet':
            return 'formSheet';
        case 'fullScreen':
        default:
            return 'transparentModal';
    }
}
//# sourceMappingURL=utils.js.map