'use client';

import React from 'react';

import { LocalRouteParamsContext } from '../Route';
import { usePreviewInfo } from '../link/preview/PreviewRouteContext';
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
  const params = React.use(LocalRouteParamsContext) ?? {};
  const { params: previewParams } = usePreviewInfo();
  // Params are already decoded upstream: query params by URLSearchParams (in
  // parseQueryParams) and path params by decodeURIComponent (in getStateFromPath).
  // Applying decodeURIComponent again here would double-decode percent-encoded
  // values (e.g. `%2F` → `/`), corrupting URLs like AWS SigV4 presigned URLs.
  // See: https://github.com/expo/expo/issues/48421
  return Object.fromEntries(
    Object.entries(previewParams ?? params).map(([key, value]) => {
      // React Navigation doesn't remove `undefined` values from the params object, and you cannot remove them via
      // `navigation.setParams()` as it shallow merges. Hence, we hide them here.
      if (value == null) {
        return [key, value];
      }
      return [key, value];
    })
  ) as any;
}
