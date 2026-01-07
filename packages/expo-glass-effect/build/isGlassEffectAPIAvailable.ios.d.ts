/**
 * Checks whether the Liquid Glass API is available at runtime on the device.
 *
 * This method was added because some iOS 26 beta versions do not have this API available, which can
 * lead to crashes. You should check this before using `GlassView` and `GlassContainer` in your app to ensure compatibility.
 * @see https://github.com/expo/expo/issues/40911
 * @platform ios
 */
export declare function isGlassEffectAPIAvailable(): boolean;
//# sourceMappingURL=isGlassEffectAPIAvailable.ios.d.ts.map