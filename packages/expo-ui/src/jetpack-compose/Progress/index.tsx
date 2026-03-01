import { requireNativeView } from 'expo';
import { ColorValue } from 'react-native';

import { ExpoModifier } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

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

function transformProps(props: CircularProgressProps | LinearProgressProps): NativeProgressProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * Renders a `CircularProgress` component.
 */
export function CircularProgress(props: CircularProgressProps) {
  return <NativeProgressView {...transformProps(props)} variant="circular" />;
}

/**
 * Renders a `LinearProgress` component.
 */
export function LinearProgress(props: LinearProgressProps) {
  return <NativeProgressView {...transformProps(props)} variant="linear" />;
}

/**
 * Renders a `CircularWavyProgress` component with wavy animation.
 */
export function CircularWavyProgress(props: CircularProgressProps) {
  return <NativeProgressView {...transformProps(props)} variant="circularWavy" />;
}

/**
 * Renders a `LinearWavyProgress` component with wavy animation.
 */
export function LinearWavyProgress(props: LinearProgressProps) {
  return <NativeProgressView {...transformProps(props)} variant="linearWavy" />;
}
