import type { NavigationRouteLike, NavigationStateLike } from './types';
export declare function findFocusedLeaf(state: NavigationStateLike): {
    route: NavigationRouteLike;
    key: string;
} | null;
export declare function collectMountedKeys(state: NavigationStateLike): Map<string, NavigationRouteLike>;
//# sourceMappingURL=stateTraversal.d.ts.map