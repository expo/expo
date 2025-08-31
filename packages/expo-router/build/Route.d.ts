import type { RouteNode } from '@expo/router-core';
import { sortRoutesWithInitial, sortRoutes } from '@expo/router-core';
import { type PropsWithChildren } from 'react';
export declare const LocalRouteParamsContext: import("react").Context<Record<string, string | undefined> | undefined>;
/** Return the RouteNode at the current contextual boundary. */
export declare function useRouteNode(): RouteNode | null;
export declare function useContextKey(): string;
export type RouteProps = PropsWithChildren<{
    node: RouteNode;
    route?: {
        params: Record<string, string | undefined>;
    };
}>;
/** Provides the matching routes and filename to the children. */
export declare function Route({ children, node, route }: RouteProps): import("react").JSX.Element;
export { sortRoutesWithInitial, sortRoutes };
//# sourceMappingURL=Route.d.ts.map