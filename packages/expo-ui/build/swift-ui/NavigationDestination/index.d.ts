import { type ReactNode } from 'react';
export interface NavigationDestinationProps {
    /**
     * The `NavigationLink` value this destination is presented for.
     */
    value: string;
    /**
     * The view pushed onto the stack for `value`.
     */
    children: ReactNode;
}
/**
 * Associates a destination view with a `NavigationLink` value, matching SwiftUI's
 * `navigationDestination(for:destination:)`. It must be a direct child of the `NavigationStack`,
 * however deeply the link that pushes it is nested inside that stack.
 *
 * Keep it mounted so the pushed screen already carries its `navigationTitle` when the slide
 * starts, or render one for each value on the stack's `path` to build screens on demand.
 *
 * @example
 * ```tsx
 * <NavigationDestination value="settings">
 *   <SettingsScreen />
 * </NavigationDestination>
 * ```
 *
 * @platform ios
 */
export declare function NavigationDestination(props: NavigationDestinationProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map