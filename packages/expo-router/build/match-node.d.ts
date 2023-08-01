import { findFocusedRoute } from './fork/findFocusedRoute';
export declare function buildMatcher(filePaths: string[]): (path: string) => null | ReturnType<typeof findFocusedRoute>;
type RoutesManifest = {
    regex: string;
    src: string;
}[];
export declare function createRoutesManifest(filePaths: string[]): RoutesManifest | null;
export {};
//# sourceMappingURL=match-node.d.ts.map