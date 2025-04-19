import { requireNativeView } from 'expo';

import { StepperProps } from '.';
import { ViewEvent } from '../src/types';

type NativeStepperProps = Omit<StepperProps, 'onValueChange'> &
  ViewEvent<'onValueChanged', { value: number }>;

const StepperNativeView: React.ComponentType<NativeStepperProps> = requireNativeView(
  'ExpoUI',
  'StepperView'
);

export function transformStepperProps(props: StepperProps): NativeStepperProps {
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
  return <StepperNativeView {...transformStepperProps(props)} />;
}
