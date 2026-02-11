import { requireNativeView } from 'expo';
import { ColorValue } from 'react-native';

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
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
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
  /**
   * Colors for switch's core elements.
   * @platform android
   */
  elementColors?: ProgressElementColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

type NativeProgressProps =
  | CircularProgressProps
  | (LinearProgressProps & {
      variant: 'linear' | 'circular' | 'linearWavy' | 'circularWavy';
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

/**
 * Renders a `CircularWavyProgress` component with wavy animation.
 */
export function CircularWavyProgress(props: CircularProgressProps) {
  return <NativeProgressView {...props} variant="circularWavy" />;
}

/**
 * Renders a `LinearWavyProgress` component with wavy animation.
 */
export function LinearWavyProgress(props: LinearProgressProps) {
  return <NativeProgressView {...props} variant="linearWavy" />;
}
