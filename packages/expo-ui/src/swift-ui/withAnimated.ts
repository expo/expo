import { requireNativeModule } from 'expo';

import { worklets } from '../State/optionalWorklets';
import { VALUE_SYMBOL } from './modifiers/animation/constants';
import type { AnimationObject, ChainableAnimationType } from './modifiers/animation/types';

const ExpoUI = requireNativeModule('ExpoUI');

/**
 * Mirrors SwiftUI's [`withAnimation(_:_:)`](https://developer.apple.com/documentation/swiftui/withanimation(_:_:)).
 * The body must be a worklet so the mutations run synchronously on the
 * UI thread inside the animation transaction.
 *
 * Performs `body` inside a SwiftUI animation transaction. Any
 * `useNativeState` values mutated by the worklet animate
 * to their new value using `animation`.
 */
export function withAnimated(animation: ChainableAnimationType | null, body: () => void): void {
  if (!worklets) {
    throw new Error(
      "withAnimated needs the 'react-native-worklets' package, which couldn't be loaded. " +
        'Install react-native-worklets and rebuild the native app, then call withAnimated again.'
    );
  }

  if (!worklets.isWorkletFunction(body)) {
    throw new Error(
      'withAnimated body must be a worklet. Worklets run synchronously on the UI thread ' +
        "so state changes are captured by SwiftUI's animation transaction. " +
        "Add the 'worklet' directive as the first statement: " +
        "() => { 'worklet'; state.value = next; }."
    );
  }

  const animationObject: AnimationObject | null =
    animation == null ? null : animation[VALUE_SYMBOL]();

  const callback = new ExpoUI.WorkletCallback(worklets.createSerializable(body));
  ExpoUI.withAnimated(animationObject, callback);
}
