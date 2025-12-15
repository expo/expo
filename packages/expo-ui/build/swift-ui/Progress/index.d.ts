import { ColorValue } from 'react-native';
import { type CommonViewModifierProps } from '../types';
type ClosedRangeDate = {
    lower: Date;
    upper: Date;
};
export type ProgressProps = {
    /**
     * The current progress value of the slider. This is a number between `0` and `1`.
     */
    progress?: number | null;
    /**
     * Progress color.
     */
    color?: ColorValue;
    /**
     * The style of the progress indicator.
     * @default 'circular'
     */
    variant?: 'linear' | 'circular';
    /**
     * The lower and upper bounds for automatic timer progress.
     */
    timerInterval?: ClosedRangeDate;
    /**
     * Whether the progress counts down instead of up.
     * @default false
     */
    countsDown?: boolean;
} & CommonViewModifierProps;
/**
 * Renders a `Progress` component.
 */
export declare function Progress(props: ProgressProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map