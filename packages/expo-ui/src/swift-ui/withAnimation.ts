import { requireNativeModule } from 'expo';

import { worklets } from '../State/optionalWorklets';
import { VALUE_SYMBOL } from './modifiers/animation/constants';
import type { AnimationObject, ChainableAnimationType } from './modifiers/animation/types';

const ExpoUI = requireNativeModule('ExpoUI');

/**
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/animationcompletioncriteria).
 */
export type WithAnimationCompletionCriteria = 'logicallyComplete' | 'removed';

/**
 * Mirrors SwiftUI's [`withAnimation(_:_:)`](https://developer.apple.com/documentation/swiftui/withanimation(_:_:)).
 * The body must be a worklet so the mutations run synchronously on the
 * UI thread inside the animation transaction.
 *
 * Performs `body` inside a SwiftUI animation transaction. Any
 * `useNativeState` values mutated by the worklet animate to their new value
 * using `animation`.
 *
 * @param animation Animation to apply, built with the `Animation` factory
 * from `@expo/ui/swift-ui/modifiers`. Pass `null` to run `body` without an
 * animation.
 * @param body Worklet that mutates one or more `useNativeState` values.
 * @param completion Optional worklet invoked on the main thread when the
 * animation finishes. Requires iOS 17 / tvOS 17; on earlier versions the
 * animation still runs but the callback is silently skipped.
 * @param completionCriteria Controls when `completion` fires. Defaults to
 * `'logicallyComplete'`.
 */
export function withAnimation(
  animation: ChainableAnimationType | null,
  body: () => void,
  completion?: () => void,
  completionCriteria?: WithAnimationCompletionCriteria
): void {
  if (!worklets) {
    throw new Error(
      "withAnimation needs the 'react-native-worklets' package, which couldn't be loaded. " +
        'Install react-native-worklets and rebuild the native app, then call withAnimation again.'
    );
  }

  if (!worklets.isWorkletFunction(body)) {
    throw new Error(
      'withAnimation body must be a worklet. Worklets run synchronously on the UI thread ' +
        "so state changes are captured by SwiftUI's animation transaction. " +
        "Add the 'worklet' directive as the first statement: " +
        "() => { 'worklet'; state.value = next; }."
    );
  }

  let completionCallback: object | null = null;
  if (completion) {
    if (!worklets.isWorkletFunction(completion)) {
      throw new Error(
        "withAnimation completion must be a worklet. Add the 'worklet' directive as the " +
          'first statement in your completion callback.'
      );
    }
    completionCallback = new ExpoUI.WorkletCallback(worklets.createSerializable(completion));
  }

  const animationObject: AnimationObject | null =
    animation == null ? null : animation[VALUE_SYMBOL]();

  const bodyCallback = new ExpoUI.WorkletCallback(worklets.createSerializable(body));
  ExpoUI.withAnimation(animationObject, bodyCallback, completionCallback, completionCriteria);
}
