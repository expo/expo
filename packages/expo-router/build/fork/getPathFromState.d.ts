import { PathConfigMap } from '@react-navigation/core';
import type { NavigationState, PartialState } from '@react-navigation/routers';
type Options<ParamList extends object> = {
    initialRouteName?: string;
    screens: PathConfigMap<ParamList>;
};
export type State = NavigationState | Omit<PartialState<NavigationState>, 'stale'>;
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
export default function getPathFromState<ParamList extends object>(state: State, _options?: Options<ParamList> & {
    preserveGroups?: boolean;
    preserveDynamicRoutes?: boolean;
}): string;
export declare function getPathDataFromState<ParamList extends object>(state: State, _options?: Options<ParamList> & {
    preserveGroups?: boolean;
    preserveDynamicRoutes?: boolean;
}): {
    path: string;
    params: Record<string, any>;
};
export declare function deepEqual(a: any, b: any): boolean;
export declare function appendBaseUrl(path: string, baseUrl?: string | undefined): string;
export {};
//# sourceMappingURL=getPathFromState.d.ts.map