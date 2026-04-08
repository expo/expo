import type { NavigationState, PartialState } from '../routers';
import type { PathConfigMap } from './types';
type Options<ParamList extends {}> = {
    path?: string;
    initialRouteName?: string;
    screens: PathConfigMap<ParamList>;
};
type ResultState = PartialState<NavigationState> & {
    state?: ResultState;
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
export declare function getStateFromPath<ParamList extends {}>(path: string, options?: Options<ParamList>): ResultState | undefined;
export {};
//# sourceMappingURL=getStateFromPath.d.ts.map