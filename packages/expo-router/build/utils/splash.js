"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._internal_maybeHideAsync = exports._internal_preventAutoHideAsync = exports.preventAutoHideAsync = exports.hideAsync = exports.hide = void 0;
const expo_1 = require("expo");
const SplashModule = (0, expo_1.requireOptionalNativeModule)('ExpoSplashScreen');
function hide() {
    if (!SplashModule) {
        return;
    }
    SplashModule.hide();
}
exports.hide = hide;
async function hideAsync() {
    hide();
}
exports.hideAsync = hideAsync;
async function preventAutoHideAsync() {
    if (!SplashModule) {
        return;
    }
    return SplashModule.preventAutoHideAsync();
}
exports.preventAutoHideAsync = preventAutoHideAsync;
async function _internal_preventAutoHideAsync() {
    if (!SplashModule) {
        return false;
    }
    return SplashModule._internal_preventAutoHideAsync();
}
exports._internal_preventAutoHideAsync = _internal_preventAutoHideAsync;
async function _internal_maybeHideAsync() {
    if (!SplashModule) {
        return false;
    }
    return SplashModule._internal_maybeHideAsync();
}
exports._internal_maybeHideAsync = _internal_maybeHideAsync;
//# sourceMappingURL=splash.js.map