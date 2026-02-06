import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { ExpoModifier, ViewEvent } from '../../types';

/**
 * Colors for slider's core elements.
 * @platform android
 */
export type SliderElementColors = {
  thumbColor?: ColorValue;
  activeTrackColor?: ColorValue;
  inactiveTrackColor?: ColorValue;
  activeTickColor?: ColorValue;
  inactiveTickColor?: ColorValue;
};

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
   * Colors for slider's core elements.
   * @platform android
   */
  elementColors?: SliderElementColors;
  /**
   * Slider color.
   */
  color?: ColorValue;
  /**
   * Callback triggered on dragging along the slider.
   */
  onValueChange?: (value: number) => void;

  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
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
    elementColors: props.elementColors
      ? props.elementColors
      : props.color
        ? {
            thumbColor: props.color,
            activeTrackColor: props.color,
            activeTickColor: props.color,
          }
        : undefined,
    color: props.color,
  };
}

export function Slider(props: SliderProps) {
  return <SliderNativeView {...transformSliderProps(props)} />;
}
