"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultHeaderHeight = getDefaultHeaderHeight;
const react_native_1 = require("react-native");
function getDefaultHeaderHeight(layout, modalPresentation, topInset) {
    let headerHeight;
    // On models with Dynamic Island the status bar height is smaller than the safe area top inset.
    const hasDynamicIsland = react_native_1.Platform.OS === 'ios' && topInset > 50;
    const statusBarHeight = hasDynamicIsland ? topInset - (5 + 1 / react_native_1.PixelRatio.get()) : topInset;
    const isLandscape = layout.width > layout.height;
    if (react_native_1.Platform.OS === 'ios') {
        if (react_native_1.Platform.isPad || react_native_1.Platform.isTV) {
            if (modalPresentation) {
                headerHeight = 56;
            }
            else {
                headerHeight = 50;
            }
        }
        else {
            if (isLandscape) {
                headerHeight = 32;
            }
            else {
                if (modalPresentation) {
                    headerHeight = 56;
                }
                else {
                    headerHeight = 44;
                }
            }
        }
    }
    else {
        headerHeight = 64;
    }
    return headerHeight + statusBarHeight;
}
//# sourceMappingURL=getDefaultHeaderHeight.js.map