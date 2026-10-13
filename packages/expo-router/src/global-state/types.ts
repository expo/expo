import type { RedirectConfig } from '../getRoutesCore';
import type { NavigationState, PartialState, useStateForPath } from '../react-navigation/native';
import type { UnknownInputParams } from '../typed-routes/types';
import type { SingularOptions } from '../useScreens';

export type StoreRedirects = readonly [RegExp, RedirectConfig, boolean];
export type ReactNavigationState = NavigationState | PartialState<NavigationState>;
export type FocusedRouteState = NonNullable<ReturnType<typeof useStateForPath>>;

export type LinkToOptions = {
  event?: string;

  /**
   * Opts this operation into or out of React transitions. Every operation in a queued batch must
   * allow transitions for the batch to use one.
   *
   * @experimental
   */
  inTransition?: boolean;

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
  __internal__previewId?: string;
};

export type NavigationOptions = Omit<LinkToOptions, 'event'>;

export type TransitionOptions = Pick<LinkToOptions, 'inTransition'>;

export type NavigationTransitionMode = 'always' | 'never' | 'preload-only';

/**
 * A tree of route names that `router.reset` uses to replace the navigation history.
 * It starts at the navigator rendered by the root `_layout`.
 *
 * Unknown route names are skipped with a warning in development. When no top-level route is
 * known, the reset does nothing. A layout's anchor is added below the given routes when they do
 * not include it.
 */
export type RouterResetState = {
  /**
   * Routes of the navigator, from the bottom of the history to the top. The last route is focused.
   */
  routes: {
    /**
     * Name of the route, as used in `<Stack.Screen name>`. For example, `(tabs)`, `[id]`, or `settings/index`.
     */
    name: string;
    /**
     * Params of the route. Dynamic segments, such as `id` in `[id]`, are passed here.
     */
    params?: UnknownInputParams;
    /**
     * Routes of the nested navigator when this route is a layout. Without it, the layout starts
     * with its anchor or first route. It is ignored on routes that are not layouts.
     */
    state?: RouterResetState;
  }[];
};
