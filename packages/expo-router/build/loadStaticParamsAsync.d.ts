import type { RouteNode } from './Route';
export declare function loadStaticParamsAsync(route: RouteNode): Promise<RouteNode>;
export declare function assertStaticParams(route: Pick<RouteNode, 'contextKey' | 'dynamic'>, params: Record<string, string | string[]>): void;
//# sourceMappingURL=loadStaticParamsAsync.d.ts.map