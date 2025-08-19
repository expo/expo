import { ColorValue } from 'react-native';
import { type CommonViewModifierProps } from '../types';
export type CircularProgressProps = {
    /**
     * The current progress value of the slider. This is a number between `0` and `1`.
     */
    progress?: number | null;
    /**
     * Progress color.
     */
    color?: ColorValue;
} & CommonViewModifierProps;
export type LinearProgressProps = {
    /**
     * The current progress value of the slider. This is a number between `0` and `1`.
     */
    progress?: number | null;
    /**
     * Progress color.
     */
    color?: ColorValue;
} & CommonViewModifierProps;
/**
 * Renders a `CircularProgress` component.
 */
export declare function CircularProgress(props: CircularProgressProps): import("react").JSX.Element;
/**
 * Renders a `LinearProgress` component.
 */
export declare function LinearProgress(props: LinearProgressProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map