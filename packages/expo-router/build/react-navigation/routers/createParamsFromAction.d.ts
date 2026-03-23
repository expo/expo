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
export declare function createParamsFromAction({ action, routeParamList }: Options): object | undefined;
export {};
//# sourceMappingURL=createParamsFromAction.d.ts.map