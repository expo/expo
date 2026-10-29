import type { RedirectConfig } from '../getRoutesCore';
import type { NavigationState, PartialState, useStateForPath } from '../react-navigation/native';
import type { SingularOptions } from '../useScreens';

export type StoreRedirects = readonly [RegExp, RedirectConfig, boolean];
export type ReactNavigationState = NavigationState | PartialState<NavigationState>;
export type FocusedRouteState = NonNullable<ReturnType<typeof useStateForPath>>;

/**
 * Column of a `SplitView`. The first `SplitView.Column` is `primary`, the second is `supplementary`, and the
 * column with the current route is `secondary`.
 */
export type SplitViewColumnName = 'primary' | 'supplementary' | 'secondary';

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

  /**
   * The `SplitView` column to show after the navigation. A compact `SplitView` shows the column at once. An expanded
   * one shows it after the next collapse. Without this option, the navigation does not change the column.
   *
   * @platform ios
   */
  splitViewColumnName?: SplitViewColumnName;

  __internal__PreviewKey?: string;
  __internal__previewId?: string;
  __internal__popToNavigator?: boolean;
};

export type NavigationOptions = Omit<LinkToOptions, 'event' | '__internal__popToNavigator'>;

export type SetParamsOptions = Pick<LinkToOptions, 'splitViewColumnName'>;

export type TransitionOptions = Pick<LinkToOptions, 'inTransition'>;

export type NavigationTransitionMode = 'always' | 'never' | 'preload-only';
