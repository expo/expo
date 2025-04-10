import { requireNativeView } from 'expo';
import { ColorValue, Platform, StyleProp, ViewStyle } from 'react-native';

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
  /**
   * Optional style to apply to the `Gauge` component.
   */
  style?: StyleProp<ViewStyle>;
};

let GaugeNativeView: React.ComponentType<GaugeProps> | null;

if (Platform.OS === 'ios') {
  GaugeNativeView = requireNativeView('ExpoUI', 'GaugeView');
}

/**
 * Renders a native `Gauge` component.
 * @platform ios
 */
export function Gauge({ type = 'default', ...props }: GaugeProps) {
  if (!GaugeNativeView) {
    return null;
  }
  return <GaugeNativeView type={type} {...props} />;
}
