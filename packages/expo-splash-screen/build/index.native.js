import { requireOptionalNativeModule } from 'expo-modules-core';
const SplashModule = requireOptionalNativeModule('ExpoSplashScreen');
export function setOptions(options) {
    if (!SplashModule) {
        return;
    }
    SplashModule.setOptions(options);
}
export function hide() {
    if (!SplashModule) {
        return;
    }
    SplashModule.hide();
}
export async function hideAsync() {
    hide();
}
export async function preventAutoHideAsync() {
    if (!SplashModule) {
        return;
    }
    return SplashModule.preventAutoHideAsync();
}
/**
 * For use by libraries that want to control the splash screen without
 * interfering with user control of it.
 * @private
 */
export async function _internal_preventAutoHideAsync() {
    if (!SplashModule) {
        return false;
    }
    return SplashModule.preventAutoHideAsync();
}
/**
 * For use by libraries that want to control the splash screen without
 * interfering with user control of it.
 * @private
 */
export async function _internal_maybeHideAsync() {
    if (!SplashModule) {
        return false;
    }
    return SplashModule._internal_maybeHideAsync();
}
;
//# sourceMappingURL=index.native.js.map