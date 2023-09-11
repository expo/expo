import { ViewProps } from 'react-native';

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
   * Due to platform differences blurs on Android and iOS vary slightly and might look different
   * at different intensity levels. This property can be used to fine tune blur intensity on Android to match it
   * more closely with iOS.
   * @default 4
   * @platform android
   *
   */
  blurReductionFactor?: number;
} & ViewProps;

export type BlurTint = 'light' | 'dark' | 'default';
