import { Router } from './imperative-api';
import { RouteParams, RouteSegments, Routes, UnknownOutputParams } from './types';
type SearchParams = Record<string, string | string[]>;
export declare function useRootNavigationState(): import("./fork/getStateFromPath").ResultState;
export declare function useRouteInfo(): import("./LocationProvider").UrlObject;
/** @deprecated use `useNavigationContainerRef()` instead, which returns a React ref. */
export declare function useRootNavigation(): import("@react-navigation/core").NavigationContainerRef<ReactNavigation.RootParamList> | null;
/** @return the root `<NavigationContainer />` ref for the app. The `ref.current` may be `null` if the `<NavigationContainer />` hasn't mounted yet. */
export declare function useNavigationContainerRef(): import("@react-navigation/core").NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
export declare function useRouter(): Router;
/**
 * @private
 * @returns the current global pathname with query params attached. This may change in the future to include the hostname from a predefined universal link, i.e. `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`
 */
export declare function useUnstableGlobalHref(): string;
/**
 * Get a list of selected file segments for the currently selected route. Segments are not normalized, so they will be the same as the file path. e.g. /[id]?id=normal -> ["[id]"]
 *
 * `useSegments` can be typed using an abstract.
 * Consider the following file structure, and strictly typed `useSegments` function:
 *
 * ```md
 * - app
 *   - [user]
 *     - index.js
 *     - followers.js
 *   - settings.js
 * ```
 * This can be strictly typed using the following abstract:
 *
 * ```ts
 * const [first, second] = useSegments<['settings'] | ['[user]'] | ['[user]', 'followers']>()
 * ```
 */
export declare function useSegments<TSegments extends Routes | RouteSegments<Routes> = Routes>(): TSegments extends string ? RouteSegments<TSegments> : TSegments;
/** @returns global selected pathname without query parameters. */
export declare function usePathname(): string;
/**
 * Get the globally selected query parameters, including dynamic path segments. This function will update even when the route is not focused.
 * Useful for analytics or other background operations that don't draw to the screen.
 *
 * When querying search params in a stack, opt-towards using `useLocalSearchParams` as these will only
 * update when the route is focused.
 *
 * @see `useLocalSearchParams`
 */
export declare function useGlobalSearchParams<TParams extends SearchParams = UnknownOutputParams>(): RouteParams<TParams>;
export declare function useGlobalSearchParams<TRoute extends Routes, TParams extends SearchParams = UnknownOutputParams>(): RouteParams<TRoute, TParams>;
/**
 * Returns the URL parameters for the contextually focused route. e.g. `/acme?foo=bar` -> `{ foo: "bar" }`.
 * This is useful for stacks where you may push a new screen that changes the query parameters.
 * For dynamic routes, both the route parameters and the search parameters are returned.
 *
 * To observe updates even when the invoking route is not focused, use `useGlobalSearchParams()`.
 *
 * @see `useGlobalSearchParams`
 */
export declare function useLocalSearchParams<TParams extends SearchParams = UnknownOutputParams>(): RouteParams<TParams>;
export declare function useLocalSearchParams<TRoute extends Routes, TParams extends SearchParams = UnknownOutputParams>(): RouteParams<TRoute, TParams>;
export declare function useSearchParams({ global }?: {
    global?: boolean | undefined;
}): URLSearchParams;
export {};
//# sourceMappingURL=hooks.d.ts.map