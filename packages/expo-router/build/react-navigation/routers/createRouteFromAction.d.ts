import type { ParamListBase } from './types';
type Options = {
    action: {
        payload: {
            name: string;
            params?: object;
        };
    };
    routeParamList: ParamListBase;
};
export declare function createRouteFromAction({ action, routeParamList }: Options): {
    key: string;
    name: string;
    params: object | undefined;
};
export {};
//# sourceMappingURL=createRouteFromAction.d.ts.map