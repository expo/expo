export declare const INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME = "__internal_expo_router_no_animation";
export declare const INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME = "__internal__expo_router_is_preview_navigation";
export declare const INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME = "__internal_expo_router_zoom_transition_source_id";
export declare const INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME = "__internal_expo_router_zoom_transition_screen_id";
/**
 * Internal navigation option name used to control gesture-based dismissal independently
 * from the user-facing `gestureEnabled` option.
 *
 * This allows Expo Router to override React Navigation's gesture behavior for specific
 * features (like zoom transitions) without affecting the user's `gestureEnabled` setting.
 * The internal value takes precedence and is mapped to `gestureEnabled` in the navigator.
 */
export declare const INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME = "internal_gestureEnabled";
/**
 * Internal navigation options that Expo Router uses to control React Navigation behavior,
 * which are not available to developers directly and do not change user-defined options.
 */
export interface InternalNavigationOptions {
    /**
     * Internal option to control gesture-based dismissal independently from user's `gestureEnabled`.
     * When set, this value overrides the user's `gestureEnabled` option.
     */
    [INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME]?: boolean;
}
declare const internalExpoRouterParamNames: readonly ["__internal_expo_router_no_animation", "__internal__expo_router_is_preview_navigation", "__internal_expo_router_zoom_transition_source_id", "__internal_expo_router_zoom_transition_screen_id"];
export type InternalExpoRouterParamName = (typeof internalExpoRouterParamNames)[number];
export type InternalExpoRouterParams = Partial<Record<InternalExpoRouterParamName, unknown>>;
export declare function appendInternalExpoRouterParams(params: Record<string, unknown> | object | undefined, expoParams: InternalExpoRouterParams): Record<string, unknown> | undefined;
export declare function getInternalExpoRouterParams(_params: Record<string, unknown> | object | undefined): InternalExpoRouterParams;
export declare function hasParam(params: unknown, paramName: string): boolean;
export declare function removeParams(params: Record<string, unknown> | object | undefined, paramName: readonly string[]): Record<string, unknown> | object | undefined;
export declare function removeInternalExpoRouterParams(params: Record<string, unknown> | object): Record<string, unknown> | object;
export declare function removeInternalExpoRouterParams(params: Record<string, unknown> | object | undefined): Record<string, unknown> | object | undefined;
export {};
//# sourceMappingURL=navigationParams.d.ts.map