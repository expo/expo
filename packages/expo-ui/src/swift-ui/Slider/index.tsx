import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

import { ViewEvent } from '../../types';
import { Host } from '../Host';

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
};

type NativeSliderProps = Omit<SliderProps, 'onValueChange'> &
  ViewEvent<'onValueChanged', { value: number }>;

const SliderNativeView: React.ComponentType<NativeSliderProps> = requireNativeView(
  'ExpoUI',
  'SliderView'
);

/**
 * @hidden
 */
export function transformSliderProps(props: SliderProps): NativeSliderProps {
  return {
    ...props,
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

export function SliderPrimitive(props: SliderProps) {
  return <SliderNativeView {...transformSliderProps(props)} />;
}

export function Slider(props: SliderProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Host style={props.style} matchContents>
      <SliderPrimitive {...props} />
    </Host>
  );
}
