export const INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME = '__internal_expo_router_no_animation';
export const INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME =
  '__internal__expo_router_is_preview_navigation';
export const INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME =
  '__internal_expo_router_zoom_transition_source_id';
export const INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME =
  '__internal_expo_router_zoom_transition_screen_id';

/**
 * Internal navigation option name used to control gesture-based dismissal independently
 * from the user-facing `gestureEnabled` option.
 *
 * This allows Expo Router to override React Navigation's gesture behavior for specific
 * features (like zoom transitions) without affecting the user's `gestureEnabled` setting.
 * The internal value takes precedence and is mapped to `gestureEnabled` in the navigator.
 */
export const INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME = 'internal_gestureEnabled';

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

const internalExpoRouterParamNames = [
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
] as const;

export type InternalExpoRouterParamName = (typeof internalExpoRouterParamNames)[number];
export type InternalExpoRouterParams = Partial<Record<InternalExpoRouterParamName, unknown>>;

export function appendInternalExpoRouterParams(
  params: Record<string, unknown> | object | undefined,
  expoParams: InternalExpoRouterParams
) {
  const newParams = { ...params, ...expoParams };
  if (Object.keys(newParams).length === 0 && params === undefined) {
    return undefined;
  }
  return newParams;
}

export function getInternalExpoRouterParams(
  _params: Record<string, unknown> | object | undefined
): InternalExpoRouterParams {
  const expoParams: InternalExpoRouterParams = {};
  const params = (_params ?? {}) as Record<string, unknown>;

  for (const key of internalExpoRouterParamNames) {
    if (key in params) {
      expoParams[key] = params[key];
    }
  }

  return expoParams;
}

export function hasParam(params: unknown, paramName: string): boolean {
  return (
    !!params &&
    typeof params === 'object' &&
    (params as Record<string, unknown>)[paramName] !== undefined
  );
}

export function removeParams(
  params: Record<string, unknown> | object | undefined,
  paramName: readonly string[]
): Record<string, unknown> | object | undefined {
  if (!params) {
    return undefined;
  }
  return Object.fromEntries(Object.entries(params).filter(([key]) => !paramName.includes(key)));
}

export function removeInternalExpoRouterParams(
  params: Record<string, unknown> | object
): Record<string, unknown> | object;
export function removeInternalExpoRouterParams(
  params: Record<string, unknown> | object | undefined
): Record<string, unknown> | object | undefined;
export function removeInternalExpoRouterParams(
  params: Record<string, unknown> | object | undefined
): Record<string, unknown> | object | undefined {
  if (!params) {
    return undefined;
  }
  return removeParams(params, internalExpoRouterParamNames);
}
