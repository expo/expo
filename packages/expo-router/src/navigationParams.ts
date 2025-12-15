export const INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME = '__internal_expo_router_no_animation';
export const INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME =
  '__internal__expo_router_is_preview_navigation';
export const INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME =
  '__internal_expo_router_zoom_transition_source_id';
export const INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME =
  '__internal_expo_router_zoom_transition_screen_id';

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
  let newParams: Record<string, unknown> = {};
  // Using nested params is a workaround for the issue with the preview key not being passed to the params
  // https://github.com/Ubax/react-navigation/blob/main/packages/core/src/useNavigationBuilder.tsx#L573
  // Another solution would be to propagate the preview key in the useNavigationBuilder,
  // but that would require us to fork the @react-navigation/core package.
  let nestedParams: Record<string, unknown> = {};
  if (params) {
    newParams = { ...params };
    if ('params' in params) {
      if (typeof params.params === 'object' && params.params) {
        nestedParams = params.params as Record<string, unknown>;
      }
    }
  }
  nestedParams = { ...nestedParams, ...expoParams };
  newParams = { ...newParams, ...expoParams };
  if (Object.keys(nestedParams).length > 0) {
    newParams.params = nestedParams;
  }
  if (Object.keys(newParams).length === 0 && params === undefined) {
    return undefined;
  }
  return newParams;
}

export function getInternalExpoRouterParams(
  _params: Record<string, unknown> | object | undefined
): InternalExpoRouterParams {
  const expoParams: InternalExpoRouterParams = {};
  const params: Record<string, unknown> = _params ? (_params as Record<string, unknown>) : {};
  const nestedParams: Record<string, unknown> =
    'params' in params && typeof params.params === 'object' && params.params
      ? (params.params as Record<string, unknown>)
      : {};

  for (const key of internalExpoRouterParamNames) {
    if (key in params) {
      expoParams[key] = params[key];
    } else if (key in nestedParams) {
      expoParams[key] = nestedParams[key];
    }
  }

  return expoParams;
}

export function hasParam(params: unknown, paramName: string): boolean {
  if (!!params && typeof params === 'object') {
    const recordParams = params as Record<string, unknown>;
    if (recordParams[paramName] !== undefined) {
      return true;
    }
    if (recordParams.params && typeof recordParams.params === 'object') {
      return hasParam(recordParams.params, paramName);
    }
  }
  return false;
}

export function removeParams(
  params: Record<string, unknown> | object | undefined,
  paramName: readonly string[]
): Record<string, unknown> | object | undefined {
  if (!params) {
    return undefined;
  }
  const nestedParams =
    'params' in params && typeof params.params === 'object' && params.params
      ? (params.params as Record<string, unknown>)
      : undefined;
  const newNestedParams = nestedParams ? removeParams(nestedParams, paramName) : undefined;
  const newParams = Object.fromEntries(
    Object.entries(params).filter(([key]) => !paramName.includes(key) && key !== 'params')
  );
  if (Object.keys(newNestedParams ?? {}).length > 0) {
    return { ...newParams, params: newNestedParams };
  }
  return newParams;
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
  return removeParams(params, [...internalExpoRouterParamNames, 'params']);
}
