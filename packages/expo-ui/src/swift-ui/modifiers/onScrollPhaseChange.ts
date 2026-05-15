import type { ScrollGeometry, ScrollPhase } from '../ScrollView';
import { createModifierWithEventListener } from './createModifier';

/**
 * Fires when SwiftUI's scroll phase changes (e.g., the user begins dragging,
 * the scroll view starts decelerating, or scrolling settles to idle). The
 * second argument is the scroll geometry sampled at the phase transition,
 * useful for reading the final offset on settle without subscribing to
 * per-frame `onScrollGeometryChange`.
 *
 * Apply to a SwiftUI `ScrollView` (and other scrollable views). On iOS below
 * 18.0 the modifier is a no-op.
 *
 * @platform ios 18.0+
 * @platform tvos 18.0+
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/onscrollphasechange(_:)).
 */
export const onScrollPhaseChange = (
  callback: (phase: ScrollPhase, geometry: ScrollGeometry) => void
) =>
  createModifierWithEventListener(
    'onScrollPhaseChange',
    (event: { phase: ScrollPhase; geometry: ScrollGeometry }) =>
      callback(event.phase, event.geometry)
  );
