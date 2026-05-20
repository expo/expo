import { type RouteNode } from 'expo-router/internal/routing';
import type { RoutesManifest } from 'expo-server/private';
export interface Group {
    pos: number;
    repeat: boolean;
    optional: boolean;
}
export interface RouteRegex {
    groups: Record<string, Group>;
    re: RegExp;
}
type GetServerManifestOptions = {
    headers?: Record<string, string | string[]>;
};
export declare function getServerManifest(route: RouteNode | null, options: GetServerManifestOptions | undefined): RoutesManifest<string>;
export {};
//# sourceMappingURL=getServerManifest.d.ts.map