import type { NavigationStateLike } from './types';
/**
 * Builds a pathname from the focused route-name chain, e.g. `/Group/Details`.
 * This mirrors how the expo-router integration derives its route pattern from
 * `useSegments()` ('/' + segments joined with '/'), so both integrations tag
 * metrics with the same stable, params-free shape. Route params are
 * intentionally not serialized into the path — they are reported separately
 * as `routeParams`.
 */
export declare function getPathname(state: NavigationStateLike | undefined): string | undefined;
//# sourceMappingURL=getPathname.d.ts.map