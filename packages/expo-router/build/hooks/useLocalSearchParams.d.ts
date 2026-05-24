import type { RouteParams, RoutePath, UnknownOutputParams } from '../types';
/**
 * @hidden
 */
export declare function useLocalSearchParams<TParams extends UnknownOutputParams = UnknownOutputParams>(): TParams;
/**
 * @hidden
 */
export declare function useLocalSearchParams<TRoute extends RoutePath>(): RouteParams<TRoute>;
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
export declare function useLocalSearchParams<TRoute extends RoutePath, TParams extends UnknownOutputParams = UnknownOutputParams>(): RouteParams<TRoute> & TParams;
//# sourceMappingURL=useLocalSearchParams.d.ts.map