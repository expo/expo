import { Router } from "./types";
type SearchParams = Record<string, string | string[]>;
export declare function useRootNavigationState(): import("./fork/getStateFromPath").ResultState;
export declare function useRouteInfo(): import("./LocationProvider").UrlObject;
export declare function useRootNavigation(): import("@react-navigation/native").NavigationContainerRef<ReactNavigation.RootParamList> | null;
export declare function useLink(): Router;
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
export declare function useSegments<TSegments extends string[] = string[]>(): TSegments;
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
export declare function useGlobalSearchParams<TParams extends SearchParams = SearchParams>(): Partial<TParams>;
/** @deprecated renamed to `useGlobalSearchParams` */
export declare function useSearchParams<TParams extends SearchParams = SearchParams>(): Partial<TParams>;
/**
 * Returns the URL search parameters for the contextually focused route. e.g. `/acme?foo=bar` -> `{ foo: "bar" }`.
 * This is useful for stacks where you may push a new screen that changes the query parameters.
 *
 * To observe updates even when the invoking route is not focused, use `useGlobalSearchParams()`.
 */
export declare function useLocalSearchParams<TParams extends SearchParams = SearchParams>(): Partial<TParams>;
export {};
//# sourceMappingURL=hooks.d.ts.map