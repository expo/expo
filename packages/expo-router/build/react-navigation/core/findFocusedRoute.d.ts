import type { InitialState } from '../routers';
type Result = {
    key?: string;
    name: string;
    params?: object;
    path?: string;
} | undefined;
export declare function findFocusedRoute(state: InitialState): Result;
export {};
//# sourceMappingURL=findFocusedRoute.d.ts.map