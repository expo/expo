import { type ColorValue } from 'react-native';
import type { ModifierConfig } from '../../types';
/**
 * Colors for slider elements. Maps directly to Material3's `SliderDefaults.colors()`.
 * @platform android
 */
export type SliderColors = {
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
     * Lower limit the user can drag the thumb to. The visible track still
     * spans `min..max`, but the thumb stops at `lowerLimit` during drag.
     */
    lowerLimit?: number;
    /**
     * Upper limit the user can drag the thumb to. The visible track still
     * spans `min..max`, but the thumb stops at `upperLimit` during drag.
     */
    upperLimit?: number;
    /**
     * Whether the slider is enabled for user interaction.
     * @default true
     */
    enabled?: boolean;
    /**
     * Colors for slider elements. Maps to Material3's `SliderDefaults.colors()`.
     * @platform android
     */
    colors?: SliderColors;
    /**
     * Callback triggered on dragging along the slider.
     */
    onValueChange?: (value: number) => void;
    /**
     * Callback triggered when the user finishes changing the value (for example, lifts a finger).
     * Maps to Material3's `onValueChangeFinished`.
     */
    onValueChangeFinished?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Slot children for custom thumb and track.
     */
    children?: React.ReactNode;
};
/**
 * A slider component that wraps Material3's `Slider`.
 *
 * @platform android
 */
declare function SliderComponent(props: SliderProps): import("react/jsx-runtime").JSX.Element;
declare namespace SliderComponent {
    var Thumb: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var Track: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
}
export { SliderComponent as Slider };
//# sourceMappingURL=index.d.ts.map