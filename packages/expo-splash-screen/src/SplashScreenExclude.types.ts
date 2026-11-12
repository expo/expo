import type { ColorValue, StyleProp, ViewProps, ViewStyle } from 'react-native';

export type SplashScreenExcludeProps = {
  /**
   * Fill for the box in the launch screen while the real content is left out (a skeleton block).
   * Without it the box is blank.
   */
  placeholderColor?: ColorValue;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
} & Omit<ViewProps, 'style' | 'children'>;
