import { type EventSubscription } from 'expo-modules-core';
import type { NavigationBarProps, NavigationBarStyle, NavigationBarVisibility, NavigationBarVisibilityEvent } from './NavigationBar.types';
/**
 * A component that allows you to configure your navigation bar declaratively.
 *
 * You will likely have multiple `NavigationBar` components mounted in the same app at the same time.
 * For example, if you have multiple screens in your app, you may end up using one per screen.
 * The props of each `NavigationBar` component will be merged in the order that they were mounted.
 */
export declare function NavigationBar(props: NavigationBarProps): null;
export declare namespace NavigationBar {
    var setStyle: (style: NavigationBarStyle) => void;
    var setHidden: (hidden: boolean) => void;
}
/**
 * @deprecated Use `NavigationBar.setStyle` instead. This will be removed in a future release.
 */
export declare const setStyle: (style: NavigationBarStyle) => void;
/**
 * Observe changes to the system navigation bar.
 * Due to platform constraints, this callback will also be triggered when the status bar visibility changes.
 *
 * @deprecated This will be removed in a future release.
 */
export declare function addVisibilityListener(listener: (event: NavigationBarVisibilityEvent) => void): EventSubscription;
/**
 * Set the navigation bar's visibility.
 *
 * @param visibility Based on CSS visibility property.
 * @platform android
 * @deprecated Use `NavigationBar.setHidden` instead. This will be removed in a future release.
 */
export declare function setVisibilityAsync(visibility: NavigationBarVisibility): Promise<void>;
/**
 * Get the navigation bar's visibility.
 *
 * @returns Navigation bar's current visibility status. Returns `hidden` on unsupported platforms (iOS, web).
 * @deprecated This will be removed in a future release.
 */
export declare function getVisibilityAsync(): Promise<NavigationBarVisibility>;
/**
 * React hook that statefully updates with the visibility of the system navigation bar.
 *
 * @returns Visibility of the navigation bar, `null` during async initialization.
 * @deprecated This will be removed in a future release.
 */
export declare function useVisibility(): NavigationBarVisibility | null;
//# sourceMappingURL=NavigationBar.d.ts.map