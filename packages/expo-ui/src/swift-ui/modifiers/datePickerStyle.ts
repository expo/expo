import { createModifier } from './createModifier';

export type DatePickerStyleType = 'automatic' | 'compact' | 'graphical' | 'wheel';

/**
 * Sets the style for the date picker.
 * @param style - The style for the date picker.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/datepickerstyle(_:)).
 */
export const datePickerStyle = (style: DatePickerStyleType) =>
  createModifier('datePickerStyle', { style });
