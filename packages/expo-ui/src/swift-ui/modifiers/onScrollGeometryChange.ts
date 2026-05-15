import { worklets } from '../../State/optionalWorklets';
import { useWorkletProp } from '../../State/useWorkletProp';
import { getStateId } from '../../State/utils';
import type { ScrollGeometry } from '../ScrollView';
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
  // Always called so the hook order is stable across renders. Returns null
  // when no worklet callback is provided.
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
