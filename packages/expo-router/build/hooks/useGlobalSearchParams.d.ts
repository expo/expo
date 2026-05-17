import type { RouteParams, RoutePath, UnknownOutputParams } from '../types';
/**
 * @hidden
 */
export declare function useGlobalSearchParams<TParams extends UnknownOutputParams = UnknownOutputParams>(): TParams;
/**
 * @hidden
 */
export declare function useGlobalSearchParams<TRoute extends RoutePath>(): RouteParams<TRoute>;
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
export declare function useGlobalSearchParams<TRoute extends RoutePath, TParams extends UnknownOutputParams = UnknownOutputParams>(): RouteParams<TRoute> & TParams;
//# sourceMappingURL=useGlobalSearchParams.d.ts.map