export declare const INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME = "__internal_expo_router_no_animation";
export declare const INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME = "__internal__expo_router_is_preview_navigation";
declare const internalExpoRouterParamNames: readonly ["__internal_expo_router_no_animation", "__internal__expo_router_is_preview_navigation"];
export type InternalExpoRouterParamName = (typeof internalExpoRouterParamNames)[number];
export type InternalExpoRouterParams = Partial<Record<InternalExpoRouterParamName, unknown>>;
export declare function appendInternalExpoRouterParams(params: Record<string, unknown> | object | undefined, expoParams: InternalExpoRouterParams): Record<string, unknown> | undefined;
export declare function getInternalExpoRouterParams(_params: Record<string, unknown> | object | undefined): InternalExpoRouterParams;
export declare function removeParams(params: Record<string, unknown> | object | undefined, paramName: readonly string[]): Record<string, unknown> | object | undefined;
export declare function removeInternalExpoRouterParams(params: Record<string, unknown> | object): Record<string, unknown> | object;
export declare function removeInternalExpoRouterParams(params: Record<string, unknown> | object | undefined): Record<string, unknown> | object | undefined;
export {};
//# sourceMappingURL=navigationParams.d.ts.map