import { ColorValue, StyleProp, ViewStyle } from 'react-native';
export type ProgressElementColors = {
    /**
     * Track color.
     *
     * @platform android
     */
    trackColor?: ColorValue;
};
export type ProgressProps = {
    /**
     * Custom styles for the progress component.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * The current progress value of the slider. This is a number between 0 and 1.
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
};
export declare function CircularProgress(props: ProgressProps): import("react").JSX.Element;
export declare function LinearProgress(props: ProgressProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map