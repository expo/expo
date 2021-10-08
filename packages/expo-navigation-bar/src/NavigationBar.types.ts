/**
 * Appearance of the foreground elements in the navigation bar, i.e. the color of the menu, back, home button icons.
 *
 * - `light` makes buttons **darker** to adjust for a mostly light nav bar.
 * - `dark` makes buttons **lighter** to adjust for a mostly dark nav bar.
 */
export type Appearance = 'light' | 'dark';

/**
 * Visibility of the navigation bar.
 */
export type Visibility = 'visible' | 'hidden';

/**
 * Interaction behavior for the system navigation bar.
 */
export type Behavior = 'overlay-swipe' | 'inset-swipe' | 'inset-touch';

/**
 * Navigation bar positional mode.
 */
export type Position = 'relative' | 'absolute';

/**
 * Current system UI visibility state. Due to platform constraints, this will return when the status bar visibility changes as well as the navigation bar.
 */
export type VisibilityEvent = {
  /**
   * Current navigation bar visibility.
   */
  visibility: Visibility;
  /**
   * Native Android system UI visibility state, returned from the native Android `setOnSystemUiVisibilityChangeListener` API.
   */
  androidState: number;
};
