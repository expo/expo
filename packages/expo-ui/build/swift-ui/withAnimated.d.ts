import type { ChainableAnimationType } from './modifiers/animation/types';
/**
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/animationcompletioncriteria).
 */
export type WithAnimatedCompletionCriteria = 'logicallyComplete' | 'removed';
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
export declare function withAnimated(animation: ChainableAnimationType | null, body: () => void, completion?: () => void, completionCriteria?: WithAnimatedCompletionCriteria): void;
//# sourceMappingURL=withAnimated.d.ts.map