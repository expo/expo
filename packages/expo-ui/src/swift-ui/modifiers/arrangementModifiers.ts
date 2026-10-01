import { createModifier } from './createModifier';

/**
 * A style that configures an `ArrangementView` with an arrangement.
 * - `'automatic'`: The default arrangement view style.
 * - `'split'`: An arrangement view style that places the primary and secondary views side by side along one or more axes.
 * - `'overlay'`: An arrangement view style that layers the primary view over the secondary view in z-order.
 */
export type ArrangementViewStyle = 'automatic' | 'split' | 'overlay';

/**
 * Sets the style for arrangement views within this view.
 * @param style - The style to apply.
 * @param options.axes - With `'split'`, creates a split arrangement that supports the given axes. With `'overlay'`, creates an overlay arrangement that supports laying out its views along the given axes.
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
 * Sets the preferred size ratio for an arrangement view in a split style. Use this modifier when
 * you want to customize the size of the view compared to its other views in the split layout.
 * @platform ios 27.1+
 * @platform tvos 27.1+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/splitarrangementlayoutratio(_:)).
 */
export function splitArrangementLayoutRatio(ratio: number): ReturnType<typeof createModifier>;
/**
 * Sets the size ratio for an arrangement view in a split style. Use this modifier when you want
 * to customize the size of the view compared to its other views in the split layout.
 * @platform ios 27.1+
 * @platform tvos 27.1+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/splitarrangementlayoutratio(minhorizontal:idealhorizontal:maxhorizontal:minvertical:idealvertical:maxvertical:)).
 */
export function splitArrangementLayoutRatio(
  params: SplitArrangementLayoutRatioParams
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
 * Sets the size constraints for an arrangement view in a split style.
 * @platform ios 27.1+
 * @platform tvos 27.1+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/splitarrangementlayoutsize(minwidth:idealwidth:maxwidth:minheight:idealheight:maxheight:)).
 */
export const splitArrangementLayoutSize = (params: {
  minWidth?: number;
  idealWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  idealHeight?: number;
  maxHeight?: number;
}) => createModifier('splitArrangementLayoutSize', params);

/**
 * Sets the preferred size constraint for an arrangement view in a split style to the ideal size
 * of the view within its container. The arrangement view will prefer this size, but may resize to
 * a smaller size depending on the priority of the view.
 * @platform ios 27.1+
 * @platform tvos 27.1+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/splitarrangementfixedlayoutsize(horizontal:vertical:)).
 */
export const splitArrangementFixedLayoutSize = (params?: {
  horizontal?: boolean;
  vertical?: boolean;
}) => createModifier('splitArrangementFixedLayoutSize', params);

/**
 * The horizontal edge a view in an overlay arrangement occupies when the arrangement transitions
 * to a horizontal layout.
 * @platform ios 27.1+
 * @platform tvos 27.1+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/overlayarrangementedge(_:)).
 */
export function overlayArrangementEdge(
  edge: 'leading' | 'trailing'
): ReturnType<typeof createModifier>;
/**
 * The vertical edge a view in an overlay arrangement occupies when the arrangement transitions to
 * a vertical layout.
 * @platform ios 27.1+
 * @platform tvos 27.1+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/overlayarrangementedge(_:)-4tjwn).
 */
export function overlayArrangementEdge(edge: 'top' | 'bottom'): ReturnType<typeof createModifier>;
export function overlayArrangementEdge(edge: 'top' | 'bottom' | 'leading' | 'trailing') {
  return createModifier('overlayArrangementEdge', { edge });
}
