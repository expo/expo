import { getStateId, useWorkletProp, worklets } from '../../State';
import {
  createModifier,
  createModifierWithEventListener,
  type ModifierConfig,
} from './createModifier';

/**
 * Status of the device hinge, as reported by SwiftUI's `DeviceHinge.Status`.
 * `'unknown'` is reserved for a status this version of Expo UI does not recognize.
 */
export type HingeStatus = 'closed' | 'partiallyOpen' | 'fullyOpen' | 'unknown';

/**
 * State of the device hinge. Mirrors SwiftUI's `DeviceHinge`.
 */
export type Hinge = {
  /**
   * The current angle of the hinge in degrees, where `0` is closed and `180` is flat. The rate and
   * granularity of angle updates are system policy, so do not depend on a particular update
   * frequency or precision. Prefer `status` when you only need to know whether the hinge is closed,
   * partially open or fully open.
   */
  angle: number;
  /**
   * The current status of the hinge, determined by the system from the angle and device orientation.
   */
  status: HingeStatus;
};

/**
 * The hinge context of the view hierarchy. Mirrors SwiftUI's `DeviceHingeContext`.
 */
export type HingeContext = {
  /**
   * The current hinge, or `null` when the device has no hinge or the view's hierarchy provides no
   * hinge updates.
   */
  hinge: Hinge | null;
};

/**
 * Calls the handler when the hinge context of the view hierarchy changes, such as when the user
 * folds or unfolds the device. The handler receives the previous and the new context. Use hinge
 * state for interactions and effects, not for layout.
 *
 * On devices without a hinge the handler is called with a `null` hinge. On iOS below 27.1, and in
 * builds made with an SDK older than iOS 27.1, the modifier is a no-op.
 *
 * @param handler - Function called with the old and the new hinge context.
 * @platform ios 27.1+
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/onhingechange(isenabled:_:)).
 *
 * @example
 * ```tsx
 * const [hinge, setHinge] = useState<Hinge | null>(null);
 *
 * <VStack modifiers={[onHingeChange((_, newContext) => setHinge(newContext.hinge))]} />
 * ```
 */
export const onHingeChange = (
  handler: (oldContext: HingeContext, newContext: HingeContext) => void
) =>
  createModifierWithEventListener(
    'onHingeChange',
    (event: { oldContext: HingeContext; newContext: HingeContext }) =>
      handler(event.oldContext, event.newContext)
  );

/**
 * Like `onHingeChange`, but when the callback is marked with the `'worklet'` directive it runs
 * synchronously on the UI thread with no JS-thread round-trip, which suits driving a shared value
 * from the continuous `angle`. Without the directive it is delivered as a regular JS event, as
 * `onHingeChange` does. Both paths share the same native modifier.
 *
 * This is a hook because the worklet path needs a stable shared-object reference across renders.
 * Call it at the top of your component, then include the returned modifier in your `modifiers`
 * array. Returns `null` when `callback` is `undefined`.
 *
 * @param callback - Function called with the old and the new hinge context.
 * @platform ios 27.1+
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/onhingechange(isenabled:_:)).
 *
 * @example
 * ```tsx
 * const hingeModifier = useHingeChange((_, newContext) => {
 *   'worklet';
 *   angle.value = newContext.hinge?.angle ?? 180;
 * });
 *
 * <VStack modifiers={[hingeModifier]} />
 * ```
 */
export function useHingeChange(
  callback: (oldContext: HingeContext, newContext: HingeContext) => void
): ModifierConfig;
export function useHingeChange(
  callback?: (oldContext: HingeContext, newContext: HingeContext) => void
): ModifierConfig | null;
export function useHingeChange(
  callback?: (oldContext: HingeContext, newContext: HingeContext) => void
): ModifierConfig | null {
  const isWorklet = !!callback && !!worklets?.isWorkletFunction?.(callback);
  const workletCallback = useWorkletProp(isWorklet ? callback : undefined, 'onHingeChange');

  if (!callback) {
    return null;
  }
  if (isWorklet && workletCallback) {
    return createModifier('onHingeChange', {
      workletCallback: getStateId(workletCallback),
    });
  }
  return onHingeChange(callback);
}
