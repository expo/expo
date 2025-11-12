import { createModifier } from './createModifier';

export type PickerStyle =
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
export const pickerStyle = (style: PickerStyle) => createModifier('pickerStyle', { style });
