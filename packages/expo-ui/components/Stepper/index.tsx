import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

import { ViewEvent } from '../../src/types';

export type StepperProps = {
  /**
   * Custom styles for the stepper component.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * The current value of the stepper.
   * @default 0
   */
  value?: number;
  /**
   * The number to increment or decrement the value by.
   * @default 1
   */
  step?: number;
  /**
   * The mininum value of the stepper.
   * @default 0
   */
  min?: number;
  /**
   * The maximum value of the stepper.
   * @default 10
   */
  max?: number;
  /**
   * Label for the stepper.
   */
  label?: string;
  /**
   * Callback triggered when the stepper value changes.
   */
  onValueChange?: (value: number) => void;
};

type NativeStepperProps = Omit<StepperProps, 'onValueChange'> &
  ViewEvent<'onValueChanged', { value: number }>;

const StepperNativeView: React.ComponentType<NativeStepperProps> = requireNativeView(
  'ExpoUI',
  'StepperView'
);

export function transformSliderProps(props: StepperProps): NativeStepperProps {
  return {
    ...props,
    step: props.step ?? 1,
    value: props.value ?? 0,
    onValueChanged: ({ nativeEvent: { value } }) => {
      props?.onValueChange?.(value);
    },
  };
}

export function Stepper(props: StepperProps) {
  return <StepperNativeView {...transformSliderProps(props)} />;
}
