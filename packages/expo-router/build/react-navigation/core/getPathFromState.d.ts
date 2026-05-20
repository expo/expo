import type { NavigationState, PartialState } from '../routers';
import type { PathConfigMap } from './types';
type Options<ParamList extends object> = {
    path?: string;
    initialRouteName?: string;
    screens: PathConfigMap<ParamList>;
};
type State = NavigationState | Omit<PartialState<NavigationState>, 'stale'>;
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
export {};
//# sourceMappingURL=getPathFromState.d.ts.map