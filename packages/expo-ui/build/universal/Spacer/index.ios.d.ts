import type { SpacerProps } from './types';
/**
 * A layout spacer that produces empty space between siblings in a
 * [`Row`](#row) or [`Column`](#column).
 *
 * On iOS this wraps SwiftUI's `Spacer`. When `flexible` is `true`, the spacer
 * keeps SwiftUI's default `.infinity` ideal length so it grows to fill the
 * available space. When `flexible` is `false` and `size` is provided, we pin
 * both dimensions with a `frame` modifier — without this, the Spacer's
 * infinity ideal propagates up and forces the enclosing `HStack` / `VStack`
 * to stretch, which causes sibling Spacers to share the extra space equally
 * instead of each rendering at their requested size.
 */
export declare function Spacer({ size, flexible, style, onAppear, onDisappear, disabled, hidden, testID, modifiers: extraModifiers, }: SpacerProps): import("react/jsx-runtime").JSX.Element;
export * from './types';
//# sourceMappingURL=index.ios.d.ts.map