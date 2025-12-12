import { requireNativeView } from 'expo';
import { ColorValue } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type ProgressProps = {
  /**
   * The current progress value of the slider. This is a number between `0` and `1`.
   */
  progress?: number | null;
  /**
   * Progress color.
   */
  color?: ColorValue;
  /**
   * The style of the progress indicator.
   * @default 'circular'
   */
  variant?: 'linear' | 'circular';
} & CommonViewModifierProps;

type NativeProgressProps = ProgressProps;

const NativeProgressView: React.ComponentType<NativeProgressProps> = requireNativeView(
  'ExpoUI',
  'ProgressView'
);

/**
 * Renders a `Progress` component.
 */
export function Progress(props: ProgressProps) {
  const { modifiers, ...restProps } = props;
  return (
    <NativeProgressView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
