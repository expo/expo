import { RefObject } from 'react';
import { ViewProps, View } from 'react-native';
/**
 * Blur method to use on Android.
 *
 * - `'none'` - Falls back to a semi-transparent view instead of rendering a blur effect.
 *
 * - `'dimezisBlurView'` - Uses a native blur view implementation based on [BlurView](https://github.com/Dimezis/BlurView) library. This method may lead to decreased performance on Android 11 and older.
 *
 * - `'dimezisBlurViewSdk31Plus'` - Uses a native blur view implementation based on [BlurView](https://github.com/Dimezis/BlurView) library on Android SDK 31 and above, for older versions of Android falls back to 'none'. This is due to performance limitations on older versions of Android, see the [performance](#performance) section to learn more.
 *
 * @platform android
 */
export type BlurMethod = 'none' | 'dimezisBlurView' | 'dimezisBlurViewSdk31Plus';
/**
 * @hidden
 * @deprecated Use `BlurMethod` instead
 * @platform android
 */
export type ExperimentalBlurMethod = BlurMethod;
export type BlurViewProps = {
    /**
     * A ref to a BlurTargetView, which this BlurView will blur as its background.
     *
     * @platform android
     */
    blurTarget?: RefObject<View | null>;
    /**
     * A tint mode which will be applied to the view.
     * @default 'default'
     */
    tint?: BlurTint;
    /**
     * A number from `1` to `100` to control the intensity of the blur effect.
     *
     * You can animate this property using `react-native-reanimated`.
     *
     * @default 50
     */
    intensity?: number;
    /**
     * A number by which the blur intensity will be divided on Android.
     *
     * When using experimental blur methods on Android, the perceived blur intensity might differ from iOS
     * at different intensity levels. This property can be used to fine tune it on Android to match it
     * more closely with iOS.
     * @default 4
     * @platform android
     *
     */
    blurReductionFactor?: number;
    /**
     * @hidden
     * @deprecated Use `blurMethod` instead.
     * @default 'none'
     * @platform android
     */
    experimentalBlurMethod?: ExperimentalBlurMethod;
    /**
     * Blur method to use on Android.
     *
     * @default 'none'
     * @platform android
     */
    blurMethod?: BlurMethod;
} & ViewProps;
export type BlurTargetViewProps = {
    ref?: RefObject<View | null>;
} & ViewProps;
export type BlurTint = 'light' | 'dark' | 'default' | 'extraLight' | 'regular' | 'prominent' | 'systemUltraThinMaterial' | 'systemThinMaterial' | 'systemMaterial' | 'systemThickMaterial' | 'systemChromeMaterial' | 'systemUltraThinMaterialLight' | 'systemThinMaterialLight' | 'systemMaterialLight' | 'systemThickMaterialLight' | 'systemChromeMaterialLight' | 'systemUltraThinMaterialDark' | 'systemThinMaterialDark' | 'systemMaterialDark' | 'systemThickMaterialDark' | 'systemChromeMaterialDark';
//# sourceMappingURL=BlurView.types.d.ts.map