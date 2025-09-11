import { requireNativeView } from 'expo';
import { ColorValue } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type CircularProgressProps = {
  /**
   * The current progress value of the slider. This is a number between `0` and `1`.
   */
  progress?: number | null;
  /**
   * Progress color.
   */
  color?: ColorValue;
} & CommonViewModifierProps;

export type LinearProgressProps = {
  /**
   * The current progress value of the slider. This is a number between `0` and `1`.
   */
  progress?: number | null;
  /**
   * Progress color.
   */
  color?: ColorValue;
} & CommonViewModifierProps;

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
  const { modifiers, ...restProps } = props;
  return (
    <NativeProgressView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      variant="circular"
    />
  );
}

/**
 * Renders a `LinearProgress` component.
 */
export function LinearProgress(props: LinearProgressProps) {
  const { modifiers, ...restProps } = props;
  return (
    <NativeProgressView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      variant="linear"
    />
  );
}
