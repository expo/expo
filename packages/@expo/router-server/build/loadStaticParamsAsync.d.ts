import type { RouteNode } from 'expo-router/build/Route';
export declare function loadStaticParamsAsync(route: RouteNode): Promise<RouteNode>;
export declare function evalStaticParamsAsync(route: RouteNode, props: {
    parentParams: any;
}, generateStaticParams?: (props: {
    params?: Record<string, string | string[]>;
}) => Record<string, string | string[]>[]): Promise<Record<string, string | string[]>[] | null>;
export declare function assertStaticParams(route: Pick<RouteNode, 'contextKey' | 'dynamic'>, params: Record<string, string | string[]>): void;
//# sourceMappingURL=loadStaticParamsAsync.d.ts.map