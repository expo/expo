import { store } from './global-state/router-store';
import { NavigationOptions } from './global-state/routing';
import { Href, RouteParamInput, Routes } from './types';

/**
 * Returns `router` object for imperative navigation API.
 *
 * @example
 *```tsx
 * import { router } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * export default function Route() {
 *
 *  return (
 *   <Text onPress={() => router.push('/home')}>Go Home</Text>
 *  );
 *}
 * ```
 */
export type Router = {
  /**
   * Goes back in the navigation history.
   */
  back: () => void;
  /**
   * Navigates to a route in the navigator's history if it supports invoking the `back` function.
   */
  canGoBack: () => boolean;
  /**
   * Navigates to the provided [`href`](#href) using a push operation if possible.
   */
  push: <T extends string | object>(href: Href<T>, options?: NavigationOptions) => void;
  /**
   * Navigates to the provided [`href`](#href).
   */
  navigate: <T extends string | object>(href: Href<T>, options?: NavigationOptions) => void;
  /**
   * Navigates to route without appending to the history. Can be used with
   * [`useFocusEffect`](#usefocuseffecteffect-do_not_pass_a_second_prop)
   * to redirect imperatively to a new screen.
   *
   * @see [Using `useRouter()` hook](/router/reference/redirects/) to redirect.
   * */
  replace: <T extends string | object>(href: Href<T>, options?: NavigationOptions) => void;
  /**
   * Navigates to the a stack lower than the current screen using the provided count if possible, otherwise 1.
   *
   * If the current screen is the only route, it will dismiss the entire stack.
   */
  dismiss: (count?: number) => void;
  /**
   * Returns to the first screen in the closest stack. This is similar to
   * [popToTop](https://reactnavigation.org/docs/stack-actions/#poptotop) stack action.
   */
  dismissAll: () => void;
  /**
   * Checks if it is possible to dismiss the current screen. Returns `true` if the
   * router is within the stack with more than one screen in stack's history.
   *
   */
  canDismiss: () => boolean;
  /**
   * Updates the current route's query params.
   */
  setParams: <T extends Routes>(params: Partial<RouteParamInput<T>>) => void;
  /**
   * Reloads the currently mounted route in experimental server mode. This can be used to re-fetch data.
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
