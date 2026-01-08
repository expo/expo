import { createModifier } from './createModifier';

export type GaugeStyleType =
  | 'automatic'
  | 'circular'
  | 'circularCapacity'
  | 'linear'
  | 'linearCapacity';

/**
 * Sets the style for the gauge.
 * @param style - The style for the gauge.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/gaugestyle).
 */
export const gaugeStyle = (style: GaugeStyleType) => createModifier('gaugeStyle', { style });
