import type { RedirectConfig } from '../getRoutesCore';
import type { NavigationState, PartialState, useStateForPath } from '../react-navigation/native';
import type { SingularOptions } from '../useScreens';

export type StoreRedirects = readonly [RegExp, RedirectConfig, boolean];
export type ReactNavigationState = NavigationState | PartialState<NavigationState>;
export type FocusedRouteState = NonNullable<ReturnType<typeof useStateForPath>>;

export type LinkToOptions = {
  event?: string;

  /**
   * Relative URL references are either relative to the directory or the document. By default, relative paths are relative to the document.
   * @see: [MDN's documentation on Resolving relative references to a URL](https://developer.mozilla.org/en-US/docs/Web/API/URL_API/Resolving_relative_references).
   */
  relativeToDirectory?: boolean;

  /**
   * Include the anchor when navigating to a new navigator
   */
  withAnchor?: boolean;

  /**
   * When navigating in a Stack, remove all screen from the history that match the singular condition
   *
   * If used with `push`, the history will be filtered even if no navigation occurs.
   */
  dangerouslySingular?: SingularOptions;

  __internal__PreviewKey?: string;
};

export type NavigationOptions = Omit<LinkToOptions, 'event'>;
