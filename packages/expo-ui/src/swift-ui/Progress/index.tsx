import { requireNativeView } from 'expo';
import { ColorValue, StyleProp, ViewStyle } from 'react-native';

export type CircularProgressProps = {
  /**
   * Custom styles for the progress component.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * The current progress value of the slider. This is a number between `0` and `1`.
   */
  progress?: number | null;
  /**
   * Progress color.
   */
  color?: ColorValue;
};

export type LinearProgressProps = {
  /**
   * Custom styles for the progress component.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * The current progress value of the slider. This is a number between `0` and `1`.
   */
  progress?: number | null;
  /**
   * Progress color.
   */
  color?: ColorValue;
};

type NativeProgressProps =
  | CircularProgressProps
  | (LinearProgressProps & {
      variant: 'linear' | 'circular';
    });

const NativeProgressView: React.ComponentType<NativeProgressProps> = requireNativeView(
  'ExpoUI',
  'ProgressView'
);

/**
 * Renders a `CircularProgress` component.
 */
export function CircularProgress(props: CircularProgressProps) {
  return <NativeProgressView {...props} variant="circular" />;
}

/**
 * Renders a `LinearProgress` component.
 */
export function LinearProgress(props: LinearProgressProps) {
  return <NativeProgressView {...props} variant="linear" />;
}
