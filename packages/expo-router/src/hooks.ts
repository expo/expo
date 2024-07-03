import { NavigationRouteContext } from '@react-navigation/native';
import React from 'react';

import { store, useStoreRootState, useStoreRouteInfo } from './global-state/router-store';
import { ExpoRouter } from '../types/expo-router';

type SearchParams = Record<string, string | string[]>;

export function useRootNavigationState() {
  return useStoreRootState();
}

export function useRouteInfo() {
  return useStoreRouteInfo();
}

/** @deprecated use `useNavigationContainerRef()` instead, which returns a React ref. */
export function useRootNavigation() {
  return store.navigationRef.current;
}

/** @return the root `<NavigationContainer />` ref for the app. The `ref.current` may be `null` if the `<NavigationContainer />` hasn't mounted yet. */
export function useNavigationContainerRef() {
  return store.navigationRef;
}

export function useRouter(): ExpoRouter.Router {
  return React.useMemo(
    () => ({
      push: store.push,
      dismiss: store.dismiss,
      dismissAll: store.dismissAll,
      canDismiss: store.canDismiss,
      back: store.goBack,
      replace: store.replace,
      setParams: store.setParams,
      canGoBack: store.canGoBack,
      navigate: store.navigate,
      // TODO(EvanBacon): add `reload`
    }),
    []
  );
}

/**
 * @private
 * @returns the current global pathname with query params attached. This may change in the future to include the hostname from a predefined universal link, i.e. `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`
 */
export function useUnstableGlobalHref(): string {
  return useStoreRouteInfo().unstable_globalHref;
}

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
export function useSegments<TSegments extends string[] = string[]>(): TSegments {
  return useStoreRouteInfo().segments as TSegments;
}

/** @returns global selected pathname without query parameters. */
export function usePathname(): string {
  return useStoreRouteInfo().pathname;
}

/**
 * Get the globally selected query parameters, including dynamic path segments. This function will update even when the route is not focused.
 * Useful for analytics or other background operations that don't draw to the screen.
 *
 * When querying search params in a stack, opt-towards using `useLocalSearchParams` as these will only
 * update when the route is focused.
 *
 * @see `useLocalSearchParams`
 */
export function useGlobalSearchParams<
  TParams extends SearchParams = SearchParams,
>(): Partial<TParams> {
  return useStoreRouteInfo().params as Partial<TParams>;
}

/**
 * Returns the URL parameters for the contextually focused route. e.g. `/acme?foo=bar` -> `{ foo: "bar" }`.
 * This is useful for stacks where you may push a new screen that changes the query parameters.
 * For dynamic routes, both the route parameters and the search parameters are returned.
 *
 * To observe updates even when the invoking route is not focused, use `useGlobalSearchParams()`.
 */
export function useLocalSearchParams<
  TParams extends SearchParams = SearchParams,
>(): Partial<TParams> {
  const params = React.useContext(NavigationRouteContext)?.params ?? {};
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (Array.isArray(value)) {
        return [
          key,
          value.map((v) => {
            try {
              return decodeURIComponent(v);
            } catch {
              return v;
            }
          }),
        ];
      } else {
        try {
          return [key, decodeURIComponent(value as string)];
        } catch {
          return [key, value];
        }
      }
    })
  ) as Partial<TParams>;
}
