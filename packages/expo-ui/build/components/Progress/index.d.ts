import { StyleProp, ViewStyle } from 'react-native';
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
    color?: string;
    /**
     * Track color.
     *
     * @platform android
     */
    trackColor?: string;
};
export declare function CircularProgress(props: ProgressProps): import("react").JSX.Element;
export declare function LinearProgress(props: ProgressProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map