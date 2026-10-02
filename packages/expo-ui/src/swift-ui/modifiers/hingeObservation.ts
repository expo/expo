import { getStateId, useWorkletProp, worklets } from '../../State';
import {
  createModifier,
  createModifierWithEventListener,
  type ModifierConfig,
} from './createModifier';

/**
 * Status of the device hinge, as reported by SwiftUI's `DeviceHinge.Status`.
 * `'unknown'` is reserved for a status this version of Expo UI does not recognize.
 * @platform ios 27.1+
 */
export type HingeStatus = 'closed' | 'partiallyOpen' | 'fullyOpen' | 'unknown';

/**
 * State of the device hinge. Mirrors SwiftUI's `DeviceHinge`.
 * @platform ios 27.1+
 */
export type Hinge = {
  /**
   * The current angle of the hinge in degrees, where `0` is closed and `180` is flat. The rate and
   * granularity of angle updates are system policy, so do not depend on a particular update
   * frequency or precision. Prefer `status` when you only need to know whether the hinge is closed,
   * partially open, or fully open.
   */
  angle: number;
  /**
   * The current status of the hinge, determined by the system from the angle and device orientation.
   */
  status: HingeStatus;
};

/**
 * The hinge context of the view hierarchy. Mirrors SwiftUI's `DeviceHingeContext`.
 * @platform ios 27.1+
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
 * folds or unfolds the device. The handler receives the old and the new context. Use hinge
 * state for interactions and effects, not for layout.
 *
 * The first call happens when the view appears, and its old context has a `null` hinge. On devices
 * without a hinge, both contexts have a `null` hinge. The modifier is a no-op on iOS versions earlier
 * than 27.1 and in builds made with Xcode earlier than 27.1.
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
 * Calls the callback when the hinge context of the view hierarchy changes, like `onHingeChange`.
 * When the callback has the `'worklet'` directive, it runs synchronously on the UI thread, so it
 * can update a native state value from the continuous `angle` with no JS-thread round trip.
 * Without the directive, the callback runs on the JS thread through a regular event, as with
 * `onHingeChange`. Both paths share the same native modifier.
 *
 * This is a hook because the worklet path needs a stable shared-object reference across renders.
 * Call it at the top of your component, then include the returned modifier in your `modifiers`
 * array. Returns `null` when `callback` is `undefined`.
 *
 * > **Note:** Running the callback on the UI thread requires installing
 * > [`react-native-worklets`](https://docs.swmansion.com/react-native-worklets/). Without it, a
 * > `'worklet'` callback runs on the JS thread instead.
 *
 * @param callback - Function called with the old and the new hinge context.
 * @platform ios 27.1+
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/onhingechange(isenabled:_:)).
 *
 * @example
 * ```tsx
 * const angle = useNativeState(180);
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
