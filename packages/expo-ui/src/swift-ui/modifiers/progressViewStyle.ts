import { createModifier } from './createModifier';

export type ProgressViewStyleType = 'automatic' | 'linear' | 'circular';

/**
 * Sets the style for the progress view.
 * @param style - The style for the progress view.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/progressviewstyle).
 */
export const progressViewStyle = (style: ProgressViewStyleType) =>
  createModifier('progressViewStyle', { style });
