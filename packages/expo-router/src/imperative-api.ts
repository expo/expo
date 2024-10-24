import { store } from './global-state/router-store';
import { NavigationOptions } from './global-state/routing';
import { Href, RouteParamInput, Routes } from './types';

export type Router = {
  /** Go back in the history. */
  back: () => void;
  /** If there's history that supports invoking the `back` function. */
  canGoBack: () => boolean;
  /** Navigate to the provided href using a push operation if possible. */
  push: <T extends string | object>(href: Href<T>, options?: NavigationOptions) => void;
  /** Navigate to the provided href. */
  navigate: <T extends string | object>(href: Href<T>, options?: NavigationOptions) => void;
  /**
   * Navigate to route without appending to the history. Can be used with
   * [`useFocusEffect`](#usefocuseffecteffect-do_not_pass_a_second_prop)
   * to redirect imperatively to a new screen.
   *
   * @see [Using `useRouter()` hook](/router/reference/redirects/) to redirect.
   * */
  replace: <T extends string | object>(href: Href<T>, options?: NavigationOptions) => void;
  /** Navigate to a screen with a stack lower than the current screen. Using the provided count if possible, otherwise 1. */
  dismiss: (count?: number) => void;
  /** Navigate to first screen within the lowest stack. */
  dismissAll: () => void;
  /** If there's history that supports invoking the `dismiss` and `dismissAll` function. */
  canDismiss: () => boolean;
  /** Update the current route query params. */
  setParams: <T extends Routes>(params: Partial<RouteParamInput<T>>) => void;

  /**
   * Reload the currently mounted route in experimental server mode. This can be used to re-fetch data.
   * @hidden
   */
  reload: () => void;
};

/**
 * @hidden
 */
export const router: Router = {
  navigate: (href, options) => store.navigate(href, options),
  push: (href, options) => store.push(href, options),
  dismiss: (count) => store.dismiss(count),
  dismissAll: () => store.dismissAll(),
  canDismiss: () => store.canDismiss(),
  replace: (href, options) => store.replace(href, options),
  back: () => store.goBack(),
  canGoBack: () => store.canGoBack(),
  setParams: (params) => store.setParams(params),
  reload: () => store.reload(),
};
