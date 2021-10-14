/**
 * Appearance of the foreground elements in the navigation bar, i.e. the color of the menu, back, home button icons.
 *
 * - `dark` makes buttons **darker** to adjust for a mostly light nav bar.
 * - `light` makes buttons **lighter** to adjust for a mostly dark nav bar.
 */
export type NavigationBarButtonStyle = 'light' | 'dark';

/**
 * Visibility of the navigation bar.
 */
export type NavigationBarVisibility = 'visible' | 'hidden';

/**
 * Interaction behavior for the system navigation bar.
 */
export type NavigationBarBehavior = 'overlay-swipe' | 'inset-swipe' | 'inset-touch';

/**
 * Navigation bar positional mode.
 */
export type NavigationBarPosition = 'relative' | 'absolute';

/**
 * Current system UI visibility state. Due to platform constraints, this will return when the status bar visibility changes as well as the navigation bar.
 */
export type NavigationBarVisibilityEvent = {
  /**
   * Current navigation bar visibility.
   */
  visibility: NavigationBarVisibility;
  /**
   * Native Android system UI visibility state, returned from the native Android `setOnSystemUiVisibilityChangeListener` API.
   */
  rawVisibility: number;
};
