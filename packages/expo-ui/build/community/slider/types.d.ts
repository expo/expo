import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
/**
 * Props for the `Slider` community drop-in component.
 * Compatible with `@react-native-community/slider`.
 */
export type SliderProps = {
    /**
     * Initial / current value of the slider.
     * Behaves like the community lib: passing a new value updates the thumb,
     * but live drag emits via `onValueChange` without needing external state.
     * @default 0
     */
    value?: number;
    /**
     * Initial minimum value of the slider.
     * @default 0
     */
    minimumValue?: number;
    /**
     * Initial maximum value of the slider.
     * @default 1
     */
    maximumValue?: number;
    /**
     * The lower limit value of the slider. The user won't be able to slide
     * below this limit.
     */
    lowerLimit?: number;
    /**
     * The upper limit value of the slider. The user won't be able to slide
     * above this limit.
     */
    upperLimit?: number;
    /**
     * If true the user won't be able to move the slider.
     * @default false
     */
    disabled?: boolean;
    /**
     * Step value of the slider. The value should be between 0 and
     * (maximumValue - minimumValue). A value of 0 means continuous (no
     * snapping).
     * @default 0
     */
    step?: number;
    /**
     * Reverses the direction of the slider so the maximum value is on the
     * left and the minimum value is on the right.
     * @default false
     */
    inverted?: boolean;
    /**
     * Color of the track to the left of the thumb.
     */
    minimumTrackTintColor?: ColorValue;
    /**
     * Color of the track to the right of the thumb.
     * @platform android
     */
    maximumTrackTintColor?: ColorValue;
    /**
     * Color of the thumb.
     * @platform android
     */
    thumbTintColor?: ColorValue;
    /**
     * Callback continuously called while the user is dragging the slider.
     */
    onValueChange?: (value: number) => void;
    /**
     * Used to style and layout the Slider.
     */
    style?: StyleProp<ViewStyle>;
};
//# sourceMappingURL=types.d.ts.map