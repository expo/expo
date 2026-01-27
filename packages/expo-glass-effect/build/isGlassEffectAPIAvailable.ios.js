import { requireNativeModule } from 'expo-modules-core';
let IS_GLASS_EFFECT_API_AVAILABLE;
/**
 * Checks whether the Liquid Glass API is available at runtime on the device.
 *
 * This method was added because some iOS 26 beta versions do not have this API available, which can
 * lead to crashes. You should check this before using `GlassView` and `GlassContainer` in your app to ensure compatibility.
 * @see https://github.com/expo/expo/issues/40911
 * @platform ios
 */
export function isGlassEffectAPIAvailable() {
    if (IS_GLASS_EFFECT_API_AVAILABLE === undefined) {
        IS_GLASS_EFFECT_API_AVAILABLE =
            requireNativeModule('ExpoGlassEffect').isGlassEffectAPIAvailable;
    }
    return !!IS_GLASS_EFFECT_API_AVAILABLE;
}
//# sourceMappingURL=isGlassEffectAPIAvailable.ios.js.map