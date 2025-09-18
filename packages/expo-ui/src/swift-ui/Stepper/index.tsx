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
   * The default value of the stepper.
   * @default 0
   */
  defaultValue?: number;
  /**
   * The minimum value of the stepper.
   * @default 0
   */
  min?: number;
  /**
   * The maximum value of the stepper.
   * @default 100
   */
  max?: number;
  /**
   * The step value for incrementing/decrementing.
   * @default 1
   */
  step?: number;
  /**
   * Whether the stepper is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Callback triggered when the stepper value changes.
   */
  onValueChange?: (value: number) => void;
} & CommonViewModifierProps;

type NativeStepperProps = Omit<StepperProps, 'onValueChange'> &
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
    defaultValue: props.defaultValue ?? 0,
    min: props.min ?? 0,
    max: props.max ?? 100,
    step: props.step ?? 1,
    disabled: props.disabled ?? false,
    onValueChanged: ({ nativeEvent: { value } }) => {
      props?.onValueChange?.(value);
    },
  };
}

export function Stepper(props: StepperProps) {
  return <StepperNativeView {...transformStepperProps(props)} />;
}
