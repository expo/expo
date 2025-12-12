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
  /**
   * The start and end dates for automatic timer progress.
   */
  timerInterval?: [Date, Date];
} & CommonViewModifierProps;

type NativeProgressProps = Omit<ProgressProps, 'timerInterval'> & {
  timerInterval?: number[];
};

const NativeProgressView: React.ComponentType<NativeProgressProps> = requireNativeView(
  'ExpoUI',
  'ProgressView'
);

/**
 * Renders a `Progress` component.
 */
export function Progress(props: ProgressProps) {
  const { modifiers, timerInterval, ...restProps } = props;
  return (
    <NativeProgressView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      timerInterval={timerInterval?.map((date) => date.getTime())}
    />
  );
}
