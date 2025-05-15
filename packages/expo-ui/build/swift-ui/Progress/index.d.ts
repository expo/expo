import { ColorValue, StyleProp, ViewStyle } from 'react-native';
export type CircularProgressProps = {
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
     * The current progress value of the slider. This is a number between `0` and `1`.
     */
    progress?: number | null;
    /**
     * Progress color.
     */
    color?: ColorValue;
};
/**
 * `<CircularProgress>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export declare function CircularProgressPrimitive(props: CircularProgressProps): import("react").JSX.Element;
/**
 * `<LinearProgress>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export declare function LinearProgressPrimitive(props: LinearProgressProps): import("react").JSX.Element;
/**
 * Renders a `CircularProgress` component.
 */
export declare function CircularProgress(props: CircularProgressProps & {
    style?: StyleProp<ViewStyle>;
}): import("react").JSX.Element;
/**
 * Renders a `LinearProgress` component.
 */
export declare function LinearProgress(props: LinearProgressProps & {
    style?: StyleProp<ViewStyle>;
}): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map