import { type CommonViewModifierProps } from '../types';
export type ClosedRangeDate = {
    lower: Date;
    upper: Date;
};
export type ProgressViewProps = {
    /**
     * The current progress value. A value between `0` and `1`.
     * When `undefined`, the progress view displays an indeterminate indicator.
     */
    value?: number | null;
    /**
     * The lower and upper bounds for automatic timer progress.
     * @platform ios 16.0+
     * @platform tvos 16.0+
     */
    timerInterval?: ClosedRangeDate;
    /**
     * A Boolean value that determines whether the view empties or fills as time passes. If true (the default), the view empties.
     * @default true
     * @platform ios 16.0+
     * @platform tvos 16.0+
     */
    countsDown?: boolean;
    /**
     * A label describing the progress view's purpose.
     */
    children?: React.ReactNode;
} & CommonViewModifierProps;
/**
 * Renders a SwiftUI `ProgressView` component.
 */
export declare function ProgressView(props: ProgressViewProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map