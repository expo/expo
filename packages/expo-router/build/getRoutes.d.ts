import type { DynamicConvention, RouteNode } from './Route';
import type { RequireContext } from './types';
export type FileNode = Pick<RouteNode, 'contextKey' | 'loadRoute'> & {
    /** Like `(tab)/index` */
    normalizedName: string;
};
type TreeNode = {
    name: string;
    children: TreeNode[];
    parents: string[];
    /** null when there is no file in a folder. */
    node: FileNode | null;
};
type Options = {
    ignore?: RegExp[];
};
/** Convert a flat map of file nodes into a nested tree of files. */
export declare function getRecursiveTree(files: FileNode[]): TreeNode;
export declare function generateDynamicFromSegment(name: string): DynamicConvention | null;
export declare function generateDynamic(name: string): RouteNode['dynamic'];
/**
 * Asserts if the require.context has files that share the same name but have different extensions. Exposed for testing.
 * @private
 */
export declare function assertDuplicateRoutes(filenames: string[]): void;
/** Given a Metro context module, return an array of nested routes. */
export declare function getRoutes(contextModule: RequireContext, options?: Options): RouteNode | null;
export declare function getRoutesAsync(contextModule: RequireContext, options?: Options): Promise<RouteNode | null>;
/** Get routes without unmatched or sitemap. */
export declare function getExactRoutes(contextModule: RequireContext, options?: Options): RouteNode | null;
export declare function getExactRoutesAsync(contextModule: RequireContext, options?: Options): Promise<RouteNode | null>;
/**
 * Exposed for testing.
 * @returns a top-level deep dynamic route if it exists, otherwise null.
 */
export declare function getUserDefinedDeepDynamicRoute(routes: RouteNode): RouteNode | null;
export {};
//# sourceMappingURL=getRoutes.d.ts.map