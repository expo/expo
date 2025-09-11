import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type SliderProps = {
  /**
   * The current value of the slider.
   * @default 0
   */
  value?: number;
  /**
   * The number of steps between the minimum and maximum values, `0` signifies infinite steps.
   * @default 0
   */
  steps?: number;
  /**
   * The minimum value of the slider. Updating this value does not trigger callbacks if the current value is below `min`.
   * @default 0
   */
  min?: number;
  /**
   * The maximum value of the slider. Updating this value does not trigger callbacks if the current value is above `max`.
   * @default 1
   */
  max?: number;
  /**
   * Slider color.
   */
  color?: string;
  /**
   * Callback triggered on dragging along the slider.
   */
  onValueChange?: (value: number) => void;
} & CommonViewModifierProps;

type NativeSliderProps = Omit<SliderProps, 'onValueChange'> &
  ViewEvent<'onValueChanged', { value: number }>;

const SliderNativeView: React.ComponentType<NativeSliderProps> = requireNativeView(
  'ExpoUI',
  'SliderView'
);

function transformSliderProps(props: SliderProps): NativeSliderProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    min: props.min ?? 0,
    max: props.max ?? 1,
    steps: props.steps ?? 0,
    value: props.value ?? 0,
    onValueChanged: ({ nativeEvent: { value } }) => {
      props?.onValueChange?.(value);
    },
    color: props.color,
  };
}

export function Slider(props: SliderProps) {
  return <SliderNativeView {...transformSliderProps(props)} />;
}
