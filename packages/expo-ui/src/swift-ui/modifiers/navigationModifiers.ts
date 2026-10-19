import { createModifier } from './createModifier';

export type NavigationSplitViewStyle = 'automatic' | 'balanced' | 'prominentDetail';

/**
 * Sets the style of a `NavigationSplitView`.
 * @param style - The style to apply.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/navigationsplitviewstyle(_:)).
 */
export const navigationSplitViewStyle = (style: NavigationSplitViewStyle) =>
  createModifier('navigationSplitViewStyle', { style });

/**
 * The resizable form of `navigationSplitViewColumnWidth`.
 */
export type NavigationSplitViewColumnWidthParams = {
  min?: number;
  ideal: number;
  max?: number;
};

/**
 * Sets the width of a column of a `NavigationSplitView`.
 *
 * Pass a number for a fixed column, or an `ideal` width with optional `min` and `max` for a
 * column that resizes with the window. Prefer the resizable form: a hardcoded sidebar width
 * does not survive every window size.
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/navigationsplitviewcolumnwidth(_:)).
 */
export function navigationSplitViewColumnWidth(width: number): ReturnType<typeof createModifier>;
export function navigationSplitViewColumnWidth(
  params: NavigationSplitViewColumnWidthParams
): ReturnType<typeof createModifier>;
export function navigationSplitViewColumnWidth(
  widthOrParams: number | NavigationSplitViewColumnWidthParams
) {
  return createModifier(
    'navigationSplitViewColumnWidth',
    typeof widthOrParams === 'number' ? { width: widthOrParams } : widthOrParams
  );
}
