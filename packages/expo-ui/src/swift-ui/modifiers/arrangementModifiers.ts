import { createModifier } from './createModifier';

/**
 * A style that configures an `ArrangementView` with an arrangement.
 * - `'automatic'`: The default style, which resolves to `'split'`.
 * - `'split'`: An arrangement view style that places the primary and secondary views side by side along one or more axes.
 * - `'overlay'`: An arrangement view style that layers the primary view over the secondary view in z-order.
 */
export type ArrangementViewStyle = 'automatic' | 'split' | 'overlay';

/**
 * Sets the style for arrangement views within this view.
 * @param style - The style to apply.
 * @param options - The `axes` the arrangement supports. With `'split'`, creates a split arrangement
 * that supports the given axes. With `'overlay'`, creates an overlay arrangement that supports
 * laying out its views along the given axes.
 * @platform ios 27.1+
 * @platform tvos 27.1+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/arrangementviewstyle(_:)).
 */
export function arrangementViewStyle(style: 'automatic'): ReturnType<typeof createModifier>;
export function arrangementViewStyle(
  style: 'split' | 'overlay',
  options?: { axes?: 'horizontal' | 'vertical' | 'both' }
): ReturnType<typeof createModifier>;
export function arrangementViewStyle(
  style: ArrangementViewStyle,
  options?: { axes?: 'horizontal' | 'vertical' | 'both' }
) {
  return createModifier('arrangementViewStyle', { style, axes: options?.axes });
}

/**
 * The minimum, ideal, and maximum ratios for `splitArrangementLayoutRatio`.
 */
export type SplitArrangementLayoutRatioParams = {
  minHorizontal?: number;
  idealHorizontal?: number;
  maxHorizontal?: number;
  minVertical?: number;
  idealVertical?: number;
  maxVertical?: number;
};

/**
 * Sets the preferred size ratio for the content of `ArrangementView.Primary` or
 * `ArrangementView.Secondary` in a split arrangement.
 * @platform ios 27.1+
 * @platform tvos 27.1+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/splitarrangementlayoutratio(_:)).
 */
export function splitArrangementLayoutRatio(ratio: number): ReturnType<typeof createModifier>;
/**
 * Sets the size ratio for the content of `ArrangementView.Primary` or `ArrangementView.Secondary`
 * in a split arrangement.
 * @platform ios 27.1+
 * @platform tvos 27.1+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/splitarrangementlayoutratio(minhorizontal:idealhorizontal:maxhorizontal:minvertical:idealvertical:maxvertical:)).
 */
export function splitArrangementLayoutRatio(
  ratios: SplitArrangementLayoutRatioParams
): ReturnType<typeof createModifier>;
export function splitArrangementLayoutRatio(
  ratioOrParams: number | SplitArrangementLayoutRatioParams
) {
  return createModifier(
    'splitArrangementLayoutRatio',
    typeof ratioOrParams === 'number' ? { ratio: ratioOrParams } : ratioOrParams
  );
}

/**
 * The minimum, ideal, and maximum sizes for `splitArrangementLayoutSize`.
 */
export type SplitArrangementLayoutSizeParams = {
  minWidth?: number;
  idealWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  idealHeight?: number;
  maxHeight?: number;
};

/**
 * Sets the size constraints for the content of `ArrangementView.Primary` or
 * `ArrangementView.Secondary` in a split arrangement.
 * @platform ios 27.1+
 * @platform tvos 27.1+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/splitarrangementlayoutsize(minwidth:idealwidth:maxwidth:minheight:idealheight:maxheight:)).
 */
export const splitArrangementLayoutSize = (constraints: SplitArrangementLayoutSizeParams) =>
  createModifier('splitArrangementLayoutSize', constraints);

/**
 * The split axes on which `splitArrangementFixedLayoutSize` prefers the ideal size of the view.
 */
export type SplitArrangementFixedLayoutSizeParams = {
  /**
   * Whether to prefer a fixed width for the view in a horizontal split.
   * @default true
   */
  horizontal?: boolean;
  /**
   * Whether to prefer a fixed height for the view in a vertical split.
   * @default true
   */
  vertical?: boolean;
};

/**
 * Sets the preferred size constraint for the content of `ArrangementView.Primary` or
 * `ArrangementView.Secondary` in a split arrangement to the ideal size of the view within its
 * container. The arrangement view prefers this size, but may resize to a smaller size depending on
 * the priority of the view.
 * @platform ios 27.1+
 * @platform tvos 27.1+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/splitarrangementfixedlayoutsize(horizontal:vertical:)).
 */
export const splitArrangementFixedLayoutSize = (options?: SplitArrangementFixedLayoutSizeParams) =>
  createModifier('splitArrangementFixedLayoutSize', options);

/**
 * Sets the horizontal edge that a view in an overlay arrangement occupies when the arrangement
 * transitions to a horizontal layout.
 * @platform ios 27.1+
 * @platform tvos 27.1+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/overlayarrangementedge(_:)).
 */
export function overlayArrangementEdge(
  edge: 'leading' | 'trailing'
): ReturnType<typeof createModifier>;
/**
 * Sets the vertical edge that a view in an overlay arrangement occupies when the arrangement
 * transitions to a vertical layout.
 * @platform ios 27.1+
 * @platform tvos 27.1+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/overlayarrangementedge(_:)-4tjwn).
 */
export function overlayArrangementEdge(edge: 'top' | 'bottom'): ReturnType<typeof createModifier>;
export function overlayArrangementEdge(edge: 'top' | 'bottom' | 'leading' | 'trailing') {
  return createModifier('overlayArrangementEdge', { edge });
}
