import { ColorValue } from 'react-native';
import { type CommonViewModifierProps } from '../types';
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
     * The start and end dates for automatic timer progress.
     */
    timerInterval?: [Date, Date];
} & CommonViewModifierProps;
/**
 * Renders a `Progress` component.
 */
export declare function Progress(props: ProgressProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map