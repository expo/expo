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
   * You can animate this property using `Animated API` from React Native or using `react-native-reanimated`.
   * > If using `react-native-reanimated` see [`animatedProps`](#animatedprops) for more details.
   * >
   * > Animating this property using `Animated API` from React Native with `setNativeDriver: true` does not work.
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
  /**
   * Animated props used for animating the BlurView's intensity.
   * This prop has to be created with `Animated.createAnimatedProps` from `react-native-reanimated`.
   *
   * > Note: When animatedProps are passed the underlying blur component will automatically be marked as Animated, therefore it is not
   * necessary to create an animated version of the `BlurView`.
   */
  animatedProps?: { intensity?: number };
} & ViewProps;

export type BlurTint = 'light' | 'dark' | 'default';
