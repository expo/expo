import { PathConfigMap } from '@react-navigation/native';
import type { NavigationState, PartialState } from '@react-navigation/routers';
import type { ExpoOptions, ExpoRouteConfig } from './getStateFromPath-forks';
import { RouterStore } from '../global-state/router-store';
export type Options<ParamList extends object> = ExpoOptions & {
    path?: string;
    initialRouteName?: string;
    screens: PathConfigMap<ParamList>;
};
type ParseConfig = Record<string, (value: string) => any>;
export type RouteConfig = ExpoRouteConfig & {
    screen: string;
    regex?: RegExp;
    path: string;
    pattern: string;
    routeNames: string[];
    parse?: ParseConfig;
};
export type InitialRouteConfig = {
    initialRouteName: string;
    parentScreens: string[];
};
export type ResultState = PartialState<NavigationState> & {
    state?: ResultState;
};
export type ParsedRoute = {
    name: string;
    path?: string;
    params?: Record<string, any> | undefined;
};
/**
 * Utility to parse a path string to initial state object accepted by the container.
 * This is useful for deep linking when we need to handle the incoming URL.
 *
 * @example
 * ```js
 * getStateFromPath(
 *   '/chat/jane/42',
 *   {
 *     screens: {
 *       Chat: {
 *         path: 'chat/:author/:id',
 *         parse: { id: Number }
 *       }
 *     }
 *   }
 * )
 * ```
 * @param path Path string to parse and convert, e.g. /foo/bar?count=42.
 * @param options Extra options to fine-tune how to parse the path.
 */
export declare function getStateFromPath<ParamList extends object>(this: RouterStore | undefined | void, path: string, options?: Options<ParamList>): ResultState | undefined;
export {};
//# sourceMappingURL=getStateFromPath.d.ts.map