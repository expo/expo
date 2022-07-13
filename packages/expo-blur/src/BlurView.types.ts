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
   * > Animating this property using `Animated API` from React Native with `setNativeDriver: true` does not work.
   *
   * @default 50
   */
  intensity?: number;
} & ViewProps;

export type BlurTint = 'light' | 'dark' | 'default';
