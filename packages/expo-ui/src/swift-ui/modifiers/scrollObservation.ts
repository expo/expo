import { getStateId, useWorkletProp, worklets } from '../../State';
import type { ScrollGeometry, ScrollPhase } from '../ScrollView';
import { createModifier, createModifierWithEventListener } from './createModifier';

/**
 * Fires when the scroll geometry changes — i.e., on every scroll update and
 * on container/content size changes. Use to drive continuous progress UI
 * such as page indicators, parallax, or fractional offsets.
 *
 * If the callback is marked with the `'worklet'` directive, it runs
 * synchronously on the UI thread (no JS-thread round-trip); otherwise it is
 * delivered asynchronously as a regular JS event. Both paths share the same
 * native modifier — the worklet variant is automatically wrapped in a
 * `WorkletCallback` shared object whose lifetime is managed by the hook.
 *
 * This is a hook because the worklet path requires a stable shared-object
 * reference across renders. Call it at the top of your component, then
 * include the returned modifier in your `modifiers` array.
 *
 * Apply to a SwiftUI `ScrollView` (and other scrollable views). On iOS below
 * 18.0 the modifier is a no-op.
 *
 * @platform ios 18.0+
 * @platform tvos 18.0+
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/onscrollgeometrychange(for:of:_:)).
 *
 * @example
 * ```tsx
 * const geometryModifier = useScrollGeometryChange((g) => {
 *   'worklet';
 *   progress.value = g.contentOffsetX / g.containerWidth;
 * });
 *
 * <ScrollView modifiers={[geometryModifier]} />
 * ```
 */
export function useScrollGeometryChange(callback?: (geometry: ScrollGeometry) => void) {
  const isWorklet = !!callback && !!worklets?.isWorkletFunction?.(callback);
  const workletCallback = useWorkletProp(
    isWorklet ? callback : undefined,
    'onScrollGeometryChange'
  );

  if (!callback) {
    return null;
  }
  if (isWorklet && workletCallback) {
    return createModifier('onScrollGeometryChange', {
      workletCallback: getStateId(workletCallback),
    });
  }
  return createModifierWithEventListener('onScrollGeometryChange', (event: ScrollGeometry) =>
    callback(event)
  );
}

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
