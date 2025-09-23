import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type StepperProps = {
  /**
   * The label text displayed with the stepper.
   */
  label: string;
  /**
   * The current value of the stepper.
   */
  value: number;
  onIncrement: (value: number) => void;
  onDecrement: (value: number) => void;
} & CommonViewModifierProps;

type NativeStepperProps = Omit<StepperProps, 'onIncrement' | 'onDecrement'> &
  ViewEvent<'onIncrement', { value: number }> &
  ViewEvent<'onDecrement', { value: number }>;

const StepperNativeView: React.ComponentType<NativeStepperProps> = requireNativeView(
  'ExpoUI',
  'StepperView'
);

function transformStepperProps(props: StepperProps): NativeStepperProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onIncrement: ({ nativeEvent: { value } }) => {
      props.onIncrement(value);
    },
    onDecrement: ({ nativeEvent: { value } }) => {
      props.onDecrement(value);
    },
  };
}

export function Stepper(props: StepperProps) {
  return <StepperNativeView {...transformStepperProps(props)} />;
}
