import { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { ExpoModifier } from '../../types';
export type ProgressElementColors = {
    /**
     * Track color.
     *
     * @platform android
     */
    trackColor?: ColorValue;
};
export type CircularProgressProps = {
    /**
     * Custom styles for the progress component.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * The current progress value of the slider. This is a number between `0` and `1`.
     */
    progress?: number | null;
    /**
     * Progress color.
     */
    color?: ColorValue;
    /**
     * Colors for switch's core elements.
     * @platform android
     */
    elementColors?: ProgressElementColors;
    /** Modifiers for the component */
    modifiers?: ExpoModifier[];
};
export type LinearProgressProps = {
    /**
     * Custom styles for the progress component.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * The current progress value of the slider. This is a number between `0` and `1`.
     */
    progress?: number | null;
    /**
     * Progress color.
     */
    color?: ColorValue;
    /**
     * Colors for switch's core elements.
     * @platform android
     */
    elementColors?: ProgressElementColors;
    /** Modifiers for the component */
    modifiers?: ExpoModifier[];
};
/**
 * Renders a `CircularProgress` component.
 */
export declare function CircularProgress(props: CircularProgressProps): import("react").JSX.Element;
/**
 * Renders a `LinearProgress` component.
 */
export declare function LinearProgress(props: LinearProgressProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map