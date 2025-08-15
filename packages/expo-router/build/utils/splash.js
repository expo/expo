"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hide = hide;
exports.hideAsync = hideAsync;
exports.preventAutoHideAsync = preventAutoHideAsync;
exports._internal_preventAutoHideAsync = _internal_preventAutoHideAsync;
exports._internal_maybeHideAsync = _internal_maybeHideAsync;
const expo_1 = require("expo");
const SplashModule = (0, expo_1.requireOptionalNativeModule)('ExpoSplashScreen');
let _initializedErrorHandler = false;
function hide() {
    if (!SplashModule) {
        return;
    }
    SplashModule.hide();
}
async function hideAsync() {
    hide();
}
async function preventAutoHideAsync() {
    if (!SplashModule) {
        return;
    }
    return SplashModule.preventAutoHideAsync();
}
async function _internal_preventAutoHideAsync() {
    // The internal function might be missing if an app is using an older version of the SplashModule
    if (!SplashModule || !SplashModule.internalPreventAutoHideAsync) {
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
async function _internal_maybeHideAsync() {
    // The internal function might be missing if an app is using an older version of the SplashModule
    if (!SplashModule || !SplashModule.internalMaybeHideAsync) {
        return false;
    }
    return SplashModule.internalMaybeHideAsync();
}
//# sourceMappingURL=splash.js.map