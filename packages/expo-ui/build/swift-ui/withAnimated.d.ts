import type { ChainableAnimationType } from './modifiers/animation/types';
/**
 * Mirrors SwiftUI's [`withAnimation(_:_:)`](https://developer.apple.com/documentation/swiftui/withanimation(_:_:)).
 * The body must be a worklet so the mutations run synchronously on the
 * UI thread inside the animation transaction.
 *
 * Performs `body` inside a SwiftUI animation transaction. Any
 * `useNativeState` values mutated by the worklet animate
 * to their new value using `animation`.
 */
export declare function withAnimated(animation: ChainableAnimationType | null, body: () => void): void;
//# sourceMappingURL=withAnimated.d.ts.map