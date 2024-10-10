import { PathConfigMap } from '@react-navigation/native';
import type { NavigationState, PartialState } from '@react-navigation/routers';
import type { ExpoOptions } from './getPathFromState-forks';
export type Options<ParamList extends object> = ExpoOptions & {
    path?: string;
    initialRouteName?: string;
    screens: PathConfigMap<ParamList>;
};
export type State = NavigationState | Omit<PartialState<NavigationState>, 'stale'>;
export type StringifyConfig = Record<string, (value: any) => string>;
/**
 * Utility to serialize a navigation state object to a path string.
 *
 * @example
 * ```js
 * getPathFromState(
 *   {
 *     routes: [
 *       {
 *         name: 'Chat',
 *         params: { author: 'Jane', id: 42 },
 *       },
 *     ],
 *   },
 *   {
 *     screens: {
 *       Chat: {
 *         path: 'chat/:author/:id',
 *         stringify: { author: author => author.toLowerCase() }
 *       }
 *     }
 *   }
 * )
 * ```
 *
 * @param state Navigation state to serialize.
 * @param options Extra options to fine-tune how to serialize the path.
 * @returns Path representing the state, e.g. /foo/bar?count=42.
 */
export declare function getPathFromState<ParamList extends object>(state: State, options?: Options<ParamList>): string;
export declare function getPathDataFromState<ParamList extends object>(state: State, options?: Options<ParamList>): {
    path: string;
    params: Record<string, any>;
};
export declare function appendBaseUrl(path: string, baseUrl?: string | undefined): string;
//# sourceMappingURL=getPathFromState.d.ts.map