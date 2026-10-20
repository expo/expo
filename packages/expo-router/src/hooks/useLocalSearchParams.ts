'use client';

import React from 'react';

import { LocalRouteParamsContext, useRouteNode } from '../Route';
import { usePreviewInfo } from '../link/preview/PreviewRouteContext';
import { NavigationStateContext } from '../react-navigation/core/NavigationStateContext';
import type { RouteParams, RoutePath, UnknownOutputParams } from '../types';

/**
 * @hidden
 */
export function useLocalSearchParams<
  TParams extends UnknownOutputParams = UnknownOutputParams,
>(): TParams;

/**
 * @hidden
 */
export function useLocalSearchParams<TRoute extends RoutePath>(): RouteParams<TRoute>;

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
export function useLocalSearchParams<
  TRoute extends RoutePath,
  TParams extends UnknownOutputParams = UnknownOutputParams,
>(): RouteParams<TRoute> & TParams;
export function useLocalSearchParams() {
  let params = React.use(LocalRouteParamsContext) ?? {};
  const node = useRouteNode();
  const { params: previewParams } = usePreviewInfo();

  if (node?.type === 'layout' && !previewParams) {
    // TODO(@ubax): Reading this context re-renders the layout on any navigation, even when params do not
    // change; outside it via https://github.com/react/react/issues/35397. Investigate a selector subscription.
    let { state } = React.use(NavigationStateContext);
    while (state) {
      const child = state.routes[state.index ?? 0];
      if (!child) break;
      params = { ...params, ...child.params };
      state = child.state;
    }
  }

  return Object.fromEntries(
    Object.entries(previewParams ?? params).map(([key, value]) => {
      // React Navigation doesn't remove `undefined` values from the params object, and you cannot remove them via
      // `navigation.setParams()` as it shallow merges. Hence, we hide them here. We also pass `null` through unchanged
      // for the same reason; running it through `decodeURIComponent()` would otherwise stringify it to `null`.
      if (value == null) {
        return [key, value];
      }

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
  ) as any;
}
