import { DynamicConvention, RouteNode } from './Route';
import { RequireContext } from './types';
export type Options = {
    ignore?: RegExp[];
    preserveApiRoutes?: boolean;
    ignoreRequireErrors?: boolean;
    ignoreEntryPoints?: boolean;
    internal_stripLoadRoute?: boolean;
    skipGenerated?: boolean;
};
/**
 * Given a Metro context module, return an array of nested routes.
 *
 * This is a two step process:
 *  1. Convert the RequireContext keys (file paths) into a directory tree.
 *      - This should extrapolate array syntax into multiple routes
 *      - Routes are given a specificity score
 *  2. Flatten the directory tree into routes
 *      - Routes in directories without _layout files are hoisted to the nearest _layout
 *      - The name of the route is relative to the nearest _layout
 *      - If multiple routes have the same name, the most specific route is used
 */
export declare function getRoutes(contextModule: RequireContext, options?: Options): RouteNode | null;
export declare function getExactRoutes(contextModule: RequireContext, options?: Options): RouteNode | null;
export declare function getIgnoreList(options?: Options): RegExp[];
export declare function generateDynamic(path: string): DynamicConvention[] | null;
//# sourceMappingURL=getRoutes.d.ts.map