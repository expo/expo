import { NavigationOptions } from './global-state/routing';
import { Href, Route, RouteInputParams } from './types';
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
    push: (href: Href, options?: NavigationOptions) => void;
    /**
     * Navigates to the provided [`href`](#href).
     */
    navigate: (href: Href, options?: NavigationOptions) => void;
    /**
     * Navigates to route without appending to the history. Can be used with
     * [`useFocusEffect`](#usefocuseffecteffect-do_not_pass_a_second_prop)
     * to redirect imperatively to a new screen.
     *
     * @see [Using `useRouter()` hook](/router/reference/redirects/) to redirect.
     * */
    replace: (href: Href, options?: NavigationOptions) => void;
    /**
     * Navigates to the a stack lower than the current screen using the provided count if possible, otherwise 1.
     *
     * If the current screen is the only route, it will dismiss the entire stack.
     */
    dismiss: (count?: number) => void;
    /**
     * Dismisses screens until the provided href is reached. If the href is not found, it will instead replace the current screen with the provided `href`.
     */
    dismissTo: (href: Href, options?: NavigationOptions) => void;
    /**
     * Returns to the first screen in the closest stack. This is similar to
     * [`popToTop`](https://reactnavigation.org/docs/stack-actions/#poptotop) stack action.
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
    setParams: <T extends Route>(params: Partial<RouteInputParams<T>>) => void;
    /**
     * Reloads the currently mounted route in experimental server mode. This can be used to re-fetch data.
     * @hidden
     */
    reload: () => void;
    /**
     * Prefetch a screen in the background before navigating to it
     */
    prefetch: (name: Href) => void;
};
/**
 * @hidden
 */
export declare const router: Router;
//# sourceMappingURL=imperative-api.d.ts.map