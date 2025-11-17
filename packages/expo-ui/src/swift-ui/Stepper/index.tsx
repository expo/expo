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
   * The initial/default value of the stepper.
   */
  defaultValue?: number;
  /**
   * The step value for increment/decrement operations.
   */
  step?: number;
  /**
   * The minimum value allowed.
   */
  min?: number;
  /**
   * The maximum value allowed.
   */
  max?: number;
  /**
   * Called when the stepper value changes.
   */
  onValueChanged: (value: number) => void;
} & CommonViewModifierProps;

type NativeStepperProps = Omit<StepperProps, 'onValueChanged'> &
  ViewEvent<'onValueChanged', { value: number }>;

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
    onValueChanged: ({ nativeEvent: { value } }) => {
      props.onValueChanged(value);
    },
  };
}

export function Stepper(props: StepperProps) {
  return <StepperNativeView {...transformStepperProps(props)} />;
}
