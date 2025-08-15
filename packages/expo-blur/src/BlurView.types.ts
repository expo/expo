import { ViewProps } from 'react-native';

/**
 * Blur method to use on Android.
 *
 * - `'none'` - Falls back to a semi-transparent view instead of rendering a blur effect.
 *
 * - `'dimezisBlurView'` - Uses a native blur view implementation based on [BlurView](https://github.com/Dimezis/BlurView) library. This method may lead to decreased performance.
 *
 * @platform android
 */
export type ExperimentalBlurMethod = 'none' | 'dimezisBlurView';

export type BlurViewProps = {
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
   * Blur method to use on Android.
   *
   * > **warning** Currently, `BlurView` support is experimental on Android and may cause performance and graphical issues.
   * It can be enabled by setting this property.
   *
   * @default 'none'
   * @platform android
   */
  experimentalBlurMethod?: ExperimentalBlurMethod;
} & ViewProps;

export type BlurTint =
  | 'light'
  | 'dark'
  | 'default'
  | 'extraLight'
  | 'regular'
  | 'prominent'
  | 'systemUltraThinMaterial'
  | 'systemThinMaterial'
  | 'systemMaterial'
  | 'systemThickMaterial'
  | 'systemChromeMaterial'
  | 'systemUltraThinMaterialLight'
  | 'systemThinMaterialLight'
  | 'systemMaterialLight'
  | 'systemThickMaterialLight'
  | 'systemChromeMaterialLight'
  | 'systemUltraThinMaterialDark'
  | 'systemThinMaterialDark'
  | 'systemMaterialDark'
  | 'systemThickMaterialDark'
  | 'systemChromeMaterialDark';
