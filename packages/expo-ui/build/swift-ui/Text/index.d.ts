import * as React from 'react';
import { type ClosedRangeDate, type CommonViewModifierProps } from '../types';
/**
 * The style used to format a date in a SwiftUI `Text` view.
 */
export type TextDateStyle = 'timer' | 'relative' | 'offset' | 'date' | 'time';
export interface TextProps extends CommonViewModifierProps {
    /**
     * Text content or nested Text components.
     */
    children?: React.ReactNode;
    /**
     * Enables Markdown formatting for the text content using SwiftUI LocalizedStringKey.
     */
    markdownEnabled?: boolean;
    /**
     * A date to display using the specified `dateStyle`. The text auto-updates as time passes.
     */
    date?: Date;
    /**
     * The style used to format the `date` prop.
     * @default 'date'
     */
    dateStyle?: TextDateStyle;
    /**
     * A time interval to display as a live-updating timer.
     * @platform ios 16.0+
     * @platform tvos 16.0+
     */
    timerInterval?: ClosedRangeDate;
    /**
     * Whether the timer counts down (`true`) or up (`false`).
     * @default true
     * @platform ios 16.0+
     * @platform tvos 16.0+
     */
    countsDown?: boolean;
    /**
     * A date at which the timer should appear paused.
     * @platform ios 16.0+
     * @platform tvos 16.0+
     */
    pauseTime?: Date;
}
export declare function Text(props: TextProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=index.d.ts.map