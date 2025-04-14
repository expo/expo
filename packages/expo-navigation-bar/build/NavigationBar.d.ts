import { NavigationBarStyle, NavigationBarVisibility } from './NavigationBar.types';
export * from './NavigationBar.types';
/**
 * Sets the style of the navigation bar.
 * > This is only supported on Android when edge-to-edge is enabled.
 */
export declare function setStyle(style: NavigationBarStyle): void;
/**
 * Set the navigation bar's visibility.
 *
 * @example
 * ```ts
 * NavigationBar.setVisibilityAsync("hidden");
 * ```
 * @param visibility Based on CSS visibility property.
 */
export declare function setVisibilityAsync(visibility: NavigationBarVisibility): void | Promise<void>;
export { addVisibilityListener, setBackgroundColorAsync, getBackgroundColorAsync, setBorderColorAsync, getVisibilityAsync, setButtonStyleAsync, getButtonStyleAsync, setPositionAsync, unstable_getPositionAsync, setBehaviorAsync, getBehaviorAsync, useVisibility, getBorderColorAsync, } from './NativeNavigationBarWrapper';
//# sourceMappingURL=NavigationBar.d.ts.map