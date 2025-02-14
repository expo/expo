import { requireNativeView } from 'expo';
import { Platform, StyleProp,  ViewStyle } from 'react-native';

/**
 * Displays a native Swift UI Gauge 
 *
 * @remarks
 *  Working on: Android reimplemtation with jetpack compose
 * 
 *
 */

type GaugeStyle = "automatic" | "linearCapacity" | "linear" | "accessoryLinear" | "accessoryCircular" | "accessoryCircularCapacity";


export type GaugeProps = {
  /**
   * The minimum value of the gauge.
   * Represents the lowest point of the gauge's range.
   */
  minValue: number;

    /**
   * The area above the Gauge view
   */
  children?: React.ReactNode

  /**
   * The maximum value of the gauge.
   * Represents the highest point of the gauge's range.
   */
  maxValue: number;

  /**
   * The current value of the gauge.
   * This value is displayed on the gauge and should be within the range of minValue and maxValue.
   */
  currentValue: number;

  /**
   * Color of the label showing the minimum value.
   */
  minLabelColor?: string;

  /**
   * Background color of the Gauge.
   * 
   */
  tintColor?: string;

  /**
   * Color of the label showing the maximum value.
   */
  maxLabelColor?: string;

  /**
   * Color of the current value display.
   * Can be used to highlight the current value with a different color.
   */
  currentValueColor?: string;

  /**
   * A string extension that is appended to the values.
   * 
   */
  valueExtension?: string;

  /**
   * The style of the gauge. (-> Type GaugeStyle)
   * 
   */
  gaugeStyle?: GaugeStyle;


  /**
   * Additional styling.
   */

  style?: StyleProp<ViewStyle>;
};

const GaugeNativeView: React.ComponentType<GaugeProps> =
  requireNativeView('ExpoUI', 'GaugeView');

export function Gauge(props: GaugeProps) {
 
  return <GaugeNativeView style={{flex: 1}} {...props}>{props.children}</GaugeNativeView>;
}
