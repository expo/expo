import { requireNativeView } from 'expo';
import { ColorValue, StyleProp, ViewStyle } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { CommonViewModifierProps } from '../types';

/**
 * The type of chart to display.
 * - `line` charts show continuous lines with optional dash array, width, point symbols, and color.
 * - `point` charts show discrete colored points with optional point style (circle, square, diamond) and size.
 * - `bar` charts show vertical bars using system colors or individual ChartDataPoint colors, with optional corner radius and width styling.
 * - `area` charts show filled areas under lines with color.
 * - `pie` charts show pie slices with optional inner radius and angular inset. Pie charts require iOS 17.0+.
 * @platform ios
 */
export type ChartType = 'line' | 'point' | 'bar' | 'area' | 'pie';

/**
 * Point symbol style options.
 * @platform ios
 */
export type PointStyle = 'circle' | 'square' | 'diamond';

/**
 * Data point for the chart.
 * @platform ios
 */
export type ChartDataPoint = {
  /**
   * X-axis value (label).
   */
  x: string;
  /**
   * Y-axis value (numeric).
   */
  y: number;
  /**
   * Optional color for this specific data point.
   */
  color?: ColorValue;
};

/**
 * Line chart specific styling options.
 */
export type LineChartStyle = {
  /**
   * Dash pattern array. Empty array or undefined for solid lines.
   * @example [5, 5] for dashed line, [2, 2] for dotted line
   */
  dashArray?: number[];
  /**
   * Line stroke width.
   */
  width?: number;
  /**
   * Point symbol style.
   */
  pointStyle?: PointStyle;
  /**
   * Point symbol size.
   */
  pointSize?: number;
  /**
   * Line color.
   */
  color?: ColorValue;
};

/**
 * Area chart specific styling options.
 */
export type AreaChartStyle = {
  /**
   * Area fill color.
   */
  color?: ColorValue;
};

/**
 * Bar chart specific styling options.
 */
export type BarChartStyle = {
  /**
   * Corner radius for rounded bar corners.
   */
  cornerRadius?: number;
  /**
   * Custom bar width.
   */
  width?: number;
};

/**
 * Pie chart specific styling options.
 */
export type PieChartStyle = {
  /**
   * Inner radius ratio (0.0 = full pie, 0.5 = donut).
   */
  innerRadius?: number;
  /**
   * Space between slices in points.
   */
  angularInset?: number;
};

/**
 * Point chart specific styling options.
 */
export type PointChartStyle = {
  /**
   * Point symbol style.
   */
  pointStyle?: PointStyle;
  /**
   * Point symbol size.
   */
  pointSize?: number;
};

export type ChartProps = {
  /**
   * Array of data points to display.
   */
  data: ChartDataPoint[];
  /**
   * Type of chart to render.
   */
  type?: ChartType;
  /**
   * Whether to show grid lines.
   */
  showGrid?: boolean;
  /**
   * Whether to animate chart changes.
   */
  animate?: boolean;
  /**
   * Whether to show chart legend.
   * - Only works when individual dataPoint colors are NOT provided (uses categorical styling)
   * - Useful for `bar` and `pie` charts (shows category colors)
   * - Not applicable for `line` and `area` charts (single-series data)
   * - If dataPoint has individual colors, legend won't appear - use data without colors to see legend
   */
  showLegend?: boolean;
  /**
   * Line chart specific styling options.
   */
  lineStyle?: LineChartStyle;
  /**
   * Point chart specific styling options.
   */
  pointStyle?: PointChartStyle;
  /**
   * Area chart specific styling options.
   */
  areaStyle?: AreaChartStyle;
  /**
   * Bar chart specific styling options.
   */
  barStyle?: BarChartStyle;
  /**
   * Pie chart specific styling options.
   */
  pieStyle?: PieChartStyle;
} & CommonViewModifierProps;

const ChartNativeView: React.ComponentType<ChartProps> = requireNativeView('ExpoUI', 'ChartView');

/**
 * Renders a native Chart component using Swift Charts.
 * @platform ios
 */
export function Chart({
  style,
  data,
  modifiers,
  ...props
}: ChartProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <ChartNativeView
      data={data}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...props}
    />
  );
}
