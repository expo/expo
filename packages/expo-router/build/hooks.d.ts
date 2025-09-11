import { useRouteInfo } from './global-state/router-store';
import { Router } from './imperative-api';
import { RouteParams, RouteSegments, UnknownOutputParams, Route } from './types';
export { useRouteInfo };
/**
 * Returns the [navigation state](https://reactnavigation.org/docs/navigation-state/)
 * of the navigator which contains the current screen.
 *
 * @example
 * ```tsx
 * import { useRootNavigationState } from 'expo-router';
 *
 * export default function Route() {
 *  const { routes } = useRootNavigationState();
 *
 *  return <Text>{routes[0].name}</Text>;
 * }
 * ```
 */
export declare function useRootNavigationState(): Readonly<{
    key: string;
    index: number;
    routeNames: string[];
    history?: unknown[];
    routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
    type: string;
    stale: false;
}>;
/**
 * @deprecated Use [`useNavigationContainerRef`](#usenavigationcontainerref) instead,
 * which returns a React `ref`.
 */
export declare function useRootNavigation(): import("@react-navigation/native").NavigationContainerRef<ReactNavigation.RootParamList> | null;
/**
 * @return The root `<NavigationContainer />` ref for the app. The `ref.current` may be `null`
 * if the `<NavigationContainer />` hasn't mounted yet.
 */
export declare function useNavigationContainerRef(): import("@react-navigation/native").NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
/**
 *
 * Returns the [Router](#router) object for imperative navigation.
 *
 * @example
 *```tsx
 * import { useRouter } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * export default function Route() {
 *  const router = useRouter();
 *
 *  return (
 *   <Text onPress={() => router.push('/home')}>Go Home</Text>
 *  );
 *}
 * ```
 */
export declare function useRouter(): Router;
/**
 * @private
 * @returns The current global pathname with query params attached. This may change in the future to include the hostname
 * from a predefined universal link. For example, `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`.
 */
export declare function useUnstableGlobalHref(): string;
/**
 * Returns a list of selected file segments for the currently selected route. Segments are not normalized,
 * so they will be the same as the file path. For example, `/[id]?id=normal` becomes `["[id]"]`.
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useSegments } from 'expo-router';
 *
 * export default function Route() {
 *   // segments = ["profile", "[user]"]
 *   const segments = useSegments();
 *
 *   return <Text>Hello</Text>;
 * }
 * ```
 *
 *
 * `useSegments` can be typed using an abstract. Consider the following file structure:
 *
 * ```md
 * - app
 *   - [user]
 *     - index.tsx
 *     - followers.tsx
 *   - settings.tsx
 * ```
 *
 *
 * This can be strictly typed using the following abstract with `useSegments` hook:
 *
 * ```tsx
 * const [first, second] = useSegments<['settings'] | ['[user]'] | ['[user]', 'followers']>()
 * ```
 */
export declare function useSegments<TSegments extends Route = Route>(): RouteSegments<TSegments>;
/**
 *  @hidden
 */
export declare function useSegments<TSegments extends RouteSegments<Route>>(): TSegments;
/**
 * Returns the currently selected route location without search parameters. For example, `/acme?foo=bar` returns `/acme`.
 * Segments will be normalized. For example, `/[id]?id=normal` becomes `/normal`.
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { usePathname } from 'expo-router';
 *
 * export default function Route() {
 *   // pathname = "/profile/baconbrix"
 *   const pathname = usePathname();
 *
 *   return <Text>Pathname: {pathname}</Text>;
 * }
 * ```
 */
export declare function usePathname(): string;
/**
 * @hidden
 */
export declare function useGlobalSearchParams<TParams extends UnknownOutputParams = UnknownOutputParams>(): TParams;
/**
 * @hidden
 */
export declare function useGlobalSearchParams<TRoute extends Route>(): RouteParams<TRoute>;
/**
 * Returns URL parameters for globally selected route, including dynamic path segments.
 * This function updates even when the route is not focused. Useful for analytics or
 * other background operations that don't draw to the screen.
 *
 * Route URL example: `acme://profile/baconbrix?extra=info`.
 *
 * When querying search params in a stack, opt-towards using
 * [`useLocalSearchParams`](#uselocalsearchparams) because it will only update when the route is focused.
 *
 * > **Note:** For usage information, see
 * [Local versus global search parameters](/router/reference/url-parameters/#local-versus-global-url-parameters).
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useGlobalSearchParams } from 'expo-router';
 *
 * export default function Route() {
 *   // user=baconbrix & extra=info
 *   const { user, extra } = useGlobalSearchParams();
 *
 *   return <Text>User: {user}</Text>;
 * }
 * ```
 */
export declare function useGlobalSearchParams<TRoute extends Route, TParams extends UnknownOutputParams = UnknownOutputParams>(): RouteParams<TRoute> & TParams;
/**
 * @hidden
 */
export declare function useLocalSearchParams<TParams extends UnknownOutputParams = UnknownOutputParams>(): TParams;
/**
 * @hidden
 */
export declare function useLocalSearchParams<TRoute extends Route>(): RouteParams<TRoute>;
/**
 * Returns the URL parameters for the contextually focused route. Useful for stacks where you may push a new screen
 * that changes the query parameters.  For dynamic routes, both the route parameters and the search parameters are returned.
 *
 * Route URL example: `acme://profile/baconbrix?extra=info`.
 *
 * To observe updates even when the invoking route is not focused, use [`useGlobalSearchParams`](#useglobalsearchparams).
 *
 * > **Note:** For usage information, see
 * [Local versus global search parameters](/router/reference/url-parameters/#local-versus-global-url-parameters).
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useLocalSearchParams } from 'expo-router';
 *
 * export default function Route() {
 *  // user=baconbrix & extra=info
 *  const { user, extra } = useLocalSearchParams();
 *
 *  return <Text>User: {user}</Text>;
 * }
 */
export declare function useLocalSearchParams<TRoute extends Route, TParams extends UnknownOutputParams = UnknownOutputParams>(): RouteParams<TRoute> & TParams;
export declare function useSearchParams({ global }?: {
    global?: boolean | undefined;
}): URLSearchParams;
//# sourceMappingURL=hooks.d.ts.map