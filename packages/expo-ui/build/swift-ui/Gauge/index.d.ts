import { type CommonViewModifierProps } from '../types';
export type GaugeProps = {
    /**
     * The current value of the gauge.
     */
    value: number;
    /**
     * The minimum value of the gauge range.
     * @default 0
     */
    min?: number;
    /**
     * The maximum value of the gauge range.
     * @default 1
     */
    max?: number;
    /**
     * A label describing the gauge's purpose.
     */
    children?: React.ReactNode;
    /**
     * A label showing the current value. Use `Text` or `Label` to display the value.
     */
    currentValueLabel?: React.ReactNode;
    /**
     * A label showing the minimum value. Use `Text` or `Label` to display the value.
     */
    minimumValueLabel?: React.ReactNode;
    /**
     * A label showing the maximum value. Use `Text` or `Label` to display the value.
     */
    maximumValueLabel?: React.ReactNode;
} & CommonViewModifierProps;
/**
 * Renders a SwiftUI `Gauge` component.
 */
export declare function Gauge(props: GaugeProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map