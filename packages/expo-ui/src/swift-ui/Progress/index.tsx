import { requireNativeView } from 'expo';
import { ColorValue } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

type ClosedRangeDate = { lower: Date; upper: Date };
type ClosedRangeInternal = { lower: number; upper: number };

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
   * The lower and upper bounds for automatic timer progress.
   */
  timerInterval?: ClosedRangeDate;
  /**
   * Whether the progress counts down instead of up.
   * @default false
   */
  countsDown?: boolean;
} & CommonViewModifierProps;

type NativeProgressProps = Omit<ProgressProps, 'timerInterval'> & {
  timerInterval?: ClosedRangeInternal;
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
      timerInterval={
        timerInterval
          ? {
              lower: timerInterval.lower.getTime(),
              upper: timerInterval.upper.getTime(),
            }
          : undefined
      }
    />
  );
}
