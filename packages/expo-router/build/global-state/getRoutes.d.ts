import { RouteNode } from '../Route';
import { RequireContext } from '../types';
type Options = {
    ignore?: RegExp[];
    preserveApiRoutes?: boolean;
    ignoreRequireErrors?: boolean;
    ignoreEntryPoints?: boolean;
    platformExtensions?: boolean;
};
/** Given a Metro context module, return an array of nested routes. */
export declare function getRoutes(contextModule: RequireContext, options?: Options): RouteNode | null;
export {};
//# sourceMappingURL=getRoutes.d.ts.map