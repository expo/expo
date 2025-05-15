import { ColorValue, StyleProp, ViewStyle } from 'react-native';
/**
 * The type of `Gauge`.
 * @platform ios
 */
export type GaugeType = 'default' | 'circular' | 'circularCapacity' | 'linear' | 'linearCapacity';
/**
 * Value options for the `Gauge` component.
 * @platform ios
 */
export type ValueOptions = {
    /**
     * Value of the element.
     */
    value: number;
    /**
     * Label of the element.
     */
    label?: string;
    /**
     * Color of the label.
     */
    color?: ColorValue;
};
export type GaugeProps = {
    /**
     * A label displayed on the `Gauge`.
     */
    label?: string;
    /**
     * Color of the label.
     */
    labelColor?: ColorValue;
    /**
     * Current value options.
     */
    current: ValueOptions;
    /**
     * Minimum value options.
     */
    min?: ValueOptions;
    /**
     * Maximum value options.
     */
    max?: ValueOptions;
    /**
     * The type of `Gauge`.
     */
    type?: GaugeType;
    /**
     * Color (or array of colors for gradient) of the `Gauge`.
     */
    color?: ColorValue | ColorValue[];
};
/**
 * `<Gauge>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export declare function GaugePrimitive({ type, ...props }: GaugeProps): import("react").JSX.Element | null;
/**
 * Renders a native `Gauge` component.
 * @platform ios
 */
export declare function Gauge(props: GaugeProps & {
    style?: StyleProp<ViewStyle>;
}): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map