import { createModifier } from './createModifier';

export type PickerStyleType =
  | 'automatic'
  | 'inline'
  | 'menu'
  | 'navigationLink'
  | 'palette'
  | 'segmented'
  | 'wheel';
/**
 * Sets the style for the picker.
 * @param style - The style for the picker.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/pickerstyle).
 */
export const pickerStyle = (style: PickerStyleType) => createModifier('pickerStyle', { style });
