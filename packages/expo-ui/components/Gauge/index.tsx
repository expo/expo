import { requireNativeView } from 'expo';
import { ColorValue, Platform, StyleProp, ViewStyle } from 'react-native';

/**
 * Gauge style type.
 */
type GuageType = 'default' | 'circular' | 'circularCapacity' | 'linear' | 'linearCapacity';

type ValueOptions = {
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

/**
 * Props for the Gauge component.
 */
export type GaugeProps = {
  /**
   * A label displayed on the Gauge.
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
   * Gauge style type.
   */
  type?: GuageType;
  /**
   * Color (or array of colors for gradient) of the Gauge.
   */
  color?: ColorValue | ColorValue[];
  /**
   * Optional style to apply to the Guage component.
   */
  style?: StyleProp<ViewStyle>;
};

let GaugeNativeView: React.ComponentType<GaugeProps> | null;

if (Platform.OS === 'ios') {
  GaugeNativeView = requireNativeView('ExpoUI', 'GaugeView');
}

export function Gauge({ type = 'default', ...props }: GaugeProps) {
  if (!GaugeNativeView) {
    return null;
  }
  return <GaugeNativeView type={type} {...props} />;
}
