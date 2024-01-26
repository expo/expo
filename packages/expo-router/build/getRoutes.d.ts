import type { DynamicConvention, RouteNode } from './Route';
import type { RequireContext } from './types';
export type FileNode = Pick<IntermediateRouteNode, 'contextKey' | 'loadRoute' | 'filePath'> & {
    /** Like `(tab)/index` */
    normalizedName: string;
};
type IntermediateRouteNode = Omit<RouteNode, 'children'> & {
    filePath: string;
    children: IntermediateRouteNode[];
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
    preserveApiRoutes?: boolean;
    ignoreRequireErrors?: boolean;
    ignoreEntryPoints?: boolean;
};
/** Convert a flat map of file nodes into a nested tree of files. */
export declare function getRecursiveTree(files: FileNode[]): TreeNode;
export declare function generateDynamicFromSegment(name: string): DynamicConvention | null;
export declare function generateDynamic(name: string): IntermediateRouteNode['dynamic'];
/**
 * Asserts if the require.context has files that share the same name but have different extensions. Exposed for testing.
 * @private
 */
export declare function assertDuplicateRoutes(filenames: string[]): void;
/** Given a Metro context module, return an array of nested routes. */
export declare function getRoutes(contextModule: RequireContext, options?: Options): RouteNode | null;
/** Get routes without unmatched or sitemap. */
export declare function getExactRoutes(contextModule: RequireContext, options?: Options): RouteNode | null;
/**
 * Exposed for testing.
 * @returns a top-level deep dynamic route if it exists, otherwise null.
 */
export declare function getUserDefinedTopLevelNotFoundRoute(routes: RouteNode | null): RouteNode | null;
export {};
//# sourceMappingURL=getRoutes.d.ts.map