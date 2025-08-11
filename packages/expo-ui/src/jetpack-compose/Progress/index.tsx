import { requireNativeView } from 'expo';
import { ColorValue, StyleProp, ViewStyle } from 'react-native';

import { ExpoModifier } from '../../types';

export type ProgressElementColors = {
  /**
   * Track color.
   *
   * @platform android
   */
  trackColor?: ColorValue;
};

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
  /**
   * Colors for switch's core elements.
   * @platform android
   */
  elementColors?: ProgressElementColors;
  /** Modifiers for the component */
  modifiers?: ExpoModifier[];
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
  /**
   * Colors for switch's core elements.
   * @platform android
   */
  elementColors?: ProgressElementColors;
  /** Modifiers for the component */
  modifiers?: ExpoModifier[];
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
  return (
    <NativeProgressView
      {...props} // @ts-expect-error
      modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}
      variant="circular"
    />
  );
}

/**
 * Renders a `LinearProgress` component.
 */
export function LinearProgress(props: LinearProgressProps) {
  return (
    <NativeProgressView
      {...props} // @ts-expect-error
      modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}
      variant="linear"
    />
  );
}
