import { requireOptionalNativeModule } from 'expo-modules-core';
const SplashModule = requireOptionalNativeModule('ExpoSplashScreen');
let _userControlledAutoHideEnabled = false;
let _preventAutoHideAsyncInvoked = false;
/**
 * Expo Router uses this internal method to ensure that we can detect if the user
 * has explicitly opted into preventing the splash screen from hiding. This means
 * they will also explicitly hide it. If they don't, we will hide it for them after
 * the navigation render completes.
 *
 * @private
 */
export async function _internal_preventAutoHideAsync() {
    if (!SplashModule) {
        return false;
    }
    // Memoize, this should only be called once.
    if (_preventAutoHideAsyncInvoked) {
        return false;
    }
    _preventAutoHideAsyncInvoked = true;
    // Append error handling to ensure any uncaught exceptions result in the splash screen being hidden.
    // This prevents the splash screen from floating over error screens.
    if (ErrorUtils?.getGlobalHandler) {
        const originalHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler((error, isFatal) => {
            hide();
            originalHandler(error, isFatal);
        });
    }
    return SplashModule.preventAutoHideAsync();
}
/**
 * Used for Expo libraries to attempt hiding the splash screen after they've completed their work.
 * If the user has explicitly opted into preventing the splash screen from hiding, we should not
 * hide it for them. This is often used for animated splash screens.
 *
 * @private
 */
export const _internal_maybeHideAsync = () => {
    // If the user has explicitly opted into preventing the splash screen from hiding,
    // we should not hide it for them. This is often used for animated splash screens.
    if (_userControlledAutoHideEnabled) {
        return;
    }
    hide();
};
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
export const preventAutoHideAsync = () => {
    // Indicate that the user is controlling the auto hide behavior.
    _userControlledAutoHideEnabled = true;
    // Prevent as usual...
    return _internal_preventAutoHideAsync();
};
//# sourceMappingURL=index.native.js.map