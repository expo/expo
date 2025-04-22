import { ColorValue, StyleProp, ViewStyle } from 'react-native';
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