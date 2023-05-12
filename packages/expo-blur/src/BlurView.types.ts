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
   * > When animating this property with `react-native-reanimated` a [`SharedValue`](https://docs.swmansion.com/react-native-reanimated/docs/api/hooks/useSharedValue/)
   * > should be passed instead of a `number`. In that case underlying component will be automatically marked as Animated, and the shared value will be applied to it.
   *
   * > Animating this property using `Animated API` from React Native with `setNativeDriver: true` does not work.
   *
   * @default 50
   */
  intensity?: number | SharedValue<number>;
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

   */
} & ViewProps;

export type BlurTint = 'light' | 'dark' | 'default';

// SharedValue definition copied from react-native-reanimated
export type SharedValue<T> = { value: T };
