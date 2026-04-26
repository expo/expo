import type { SpacerProps } from './types';
/**
 * A layout spacer that produces empty space between siblings in a
 * [`Row`](#row) or [`Column`](#column).
 *
 * On Android, a fixed-size spacer applies `size(size, size)` so it works in
 * both horizontal and vertical containers. A flexible spacer uses Compose's
 * `weight(1)` modifier to fill remaining space.
 */
export declare function Spacer({ size, flexible, style, onAppear, onDisappear, disabled, hidden, testID, modifiers: extraModifiers, }: SpacerProps): import("react/jsx-runtime").JSX.Element | null;
export * from './types';
//# sourceMappingURL=index.android.d.ts.map