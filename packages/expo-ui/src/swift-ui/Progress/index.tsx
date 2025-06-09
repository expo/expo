import { requireNativeView } from 'expo';
import { ColorValue, StyleProp, ViewStyle } from 'react-native';

import { Host } from '../Host';

export type CircularProgressProps = {
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
 * `<CircularProgress>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function CircularProgressPrimitive(props: CircularProgressProps) {
  return <NativeProgressView {...props} variant="circular" />;
}

/**
 * `<LinearProgress>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function LinearProgressPrimitive(props: LinearProgressProps) {
  return <NativeProgressView {...props} variant="linear" />;
}

/**
 * Renders a `CircularProgress` component.
 */
export function CircularProgress(props: CircularProgressProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Host style={props.style} matchContents>
      <CircularProgressPrimitive {...props} />
    </Host>
  );
}

/**
 * Renders a `LinearProgress` component.
 */
export function LinearProgress(props: LinearProgressProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Host style={props.style} matchContents>
      <LinearProgressPrimitive {...props} />
    </Host>
  );
}
