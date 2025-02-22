import { requireNativeView } from 'expo';
import { ColorValue, StyleProp, ViewStyle } from 'react-native';

export type ProgressElementColors = {
  /**
   * Track color.
   *
   * @platform android
   */
  trackColor?: ColorValue;
};

export type ProgressProps = {
  /**
   * Custom styles for the progress component.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * The current progress value of the slider. This is a number between 0 and 1.
   */
  progress?: number | null;
  /**
   * Progress color.
   */
  color?: ColorValue;
  /**
   * Colors for switch's core elements.
   * @platform android
   */
  elementColors?: ProgressElementColors;
};

type NativeProgressProps = ProgressProps & {
  variant: 'linear' | 'circular';
};

const NativeProgressView: React.ComponentType<NativeProgressProps> = requireNativeView(
  'ExpoUI',
  'ProgressView'
);

export function CircularProgress(props: ProgressProps) {
  return <NativeProgressView {...props} variant="circular" />;
}

export function LinearProgress(props: ProgressProps) {
  return <NativeProgressView {...props} variant="linear" />;
}
