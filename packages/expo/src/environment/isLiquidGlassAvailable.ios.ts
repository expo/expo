import { requireNativeModule } from 'expo-modules-core';

const IS_LIQUID_GLASS_AVAILABLE = requireNativeModule(
  'ExpoLiquidGlassConstants'
).isLiquidGlassAvailable;

/**
 * Indicates whether the app is using the Liquid Glass design. The value will be `true` when the
 * Liquid Glass components are available in the app.
 *
 * This only checks for component availability. The value may also be `true` if the user has enabled
 * accessibility settings that limit the Liquid Glass effect.
 * To check if the user has disabled the Liquid Glass effect via accessibility settings, use
 * [`AccessibilityInfo.isReduceTransparencyEnabled()`](https://reactnative.dev/docs/accessibilityinfo#isreducetransparencyenabled-ios).
 *
 * @platform ios
 */
export function isLiquidGlassAvailable(): boolean {
  return IS_LIQUID_GLASS_AVAILABLE;
}
