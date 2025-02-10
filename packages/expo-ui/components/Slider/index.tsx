import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

import { ViewEvent } from '../../src/types';

/**
 * Colors for slider's core elements.
 * @platform android
 */
export type SliderElementColors = {
  thumbColor?: string;
  activeTrackColor?: string;
  inactiveTrackColor?: string;
  activeTickColor?: string;
  inactiveTickColor?: string;
};

export type SliderProps = {
  /**
   * Custom styles for the slider component.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * The current value of the slider.
   * @default 0
   */
  value?: number;
  /**
   * The number of steps between the minimum and maximum values. 0 signifies infinite steps.
   * @default 0
   */
  steps?: number;
  /**
   * The mininum value of the slider. Updating this value does not trigger callbacks if the current value is below `min`.
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
  colors?: SliderElementColors;
  /**
   * Callback triggered on dragging along the slider.
   */
  onValueChange?: (value: number) => void;
};

const SliderNativeView: React.ComponentType<
  Omit<SliderProps, 'onValueChange'> & ViewEvent<'onValueChanged', { value: number }>
> = requireNativeView('ExpoUI', 'SliderView');

export function Slider(props: SliderProps) {
  return (
    <SliderNativeView
      {...props}
      colors={{ ...props.colors }}
      min={props.min ?? 0}
      max={props.max ?? 1}
      steps={props.steps ?? 0}
      value={props.value ?? 0}
      onValueChanged={({ nativeEvent: { value } }) => {
        props?.onValueChange?.(value);
      }}
    />
  );
}
