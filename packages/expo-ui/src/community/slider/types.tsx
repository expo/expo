import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Props for the `Slider` community drop-in component.
 * Compatible with `@react-native-community/slider`.
 */
export type SliderProps = {
  /**
   * Initial / current value of the slider. Defaults to 0.
   * Behaves like the community lib: passing a new value updates the thumb,
   * but live drag emits via `onValueChange` without needing external state.
   */
  value?: number;
  /**
   * Initial minimum value of the slider. Default value is 0.
   */
  minimumValue?: number;
  /**
   * Initial maximum value of the slider. Default value is 1.
   */
  maximumValue?: number;
  /**
   * Callback continuously called while the user is dragging the slider.
   */
  onValueChange?: (value: number) => void;
  /**
   * Used to style and layout the Slider.
   */
  style?: StyleProp<ViewStyle>;
};
