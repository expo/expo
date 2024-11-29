"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._internal_maybeHideAsync = exports._internal_preventAutoHideAsync = exports.preventAutoHideAsync = exports.hideAsync = exports.hide = void 0;
const expo_1 = require("expo");
const SplashModule = (0, expo_1.requireOptionalNativeModule)('ExpoSplashScreen');
let _initializedErrorHandler = false;
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
    if (!_initializedErrorHandler) {
        // Append error handling to ensure any uncaught exceptions result in the splash screen being hidden.
        // This prevents the splash screen from floating over error screens.
        if (ErrorUtils?.getGlobalHandler) {
            const originalHandler = ErrorUtils.getGlobalHandler();
            ErrorUtils.setGlobalHandler((error, isFatal) => {
                hide();
                originalHandler(error, isFatal);
            });
        }
        _initializedErrorHandler = true;
    }
    return SplashModule.internalPreventAutoHideAsync();
}
exports._internal_preventAutoHideAsync = _internal_preventAutoHideAsync;
async function _internal_maybeHideAsync() {
    if (!SplashModule) {
        return false;
    }
    return SplashModule.internalMaybeHideAsync();
}
exports._internal_maybeHideAsync = _internal_maybeHideAsync;
//# sourceMappingURL=splash.js.map