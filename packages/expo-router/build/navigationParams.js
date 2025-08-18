"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendInternalExpoRouterParams = appendInternalExpoRouterParams;
exports.getInternalExpoRouterParams = getInternalExpoRouterParams;
exports.removeInternalExpoRouterParams = removeInternalExpoRouterParams;
const INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME = '__internal_expo_router_no_animation';
const INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME = '__internal__expo_router_is_preview_navigation';
const internalExpoRouterParamNames = [
    INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
    INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
];
function appendInternalExpoRouterParams(params, expoParams) {
    let newParams = {};
    // Using nested params is a workaround for the issue with the preview key not being passed to the params
    // https://github.com/Ubax/react-navigation/blob/main/packages/core/src/useNavigationBuilder.tsx#L573
    // Another solution would be to propagate the preview key in the useNavigationBuilder,
    // but that would require us to fork the @react-navigation/core package.
    let nestedParams = {};
    if (params) {
        newParams = { ...params };
        if ('params' in params) {
            if (typeof params.params === 'object' && params.params) {
                nestedParams = params.params;
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
function getInternalExpoRouterParams(_params) {
    const expoParams = {};
    const params = _params ? _params : {};
    const nestedParams = 'params' in params && typeof params.params === 'object' && params.params
        ? params.params
        : {};
    for (const key of internalExpoRouterParamNames) {
        if (key in params) {
            expoParams[key] = params[key];
        }
        else if (key in nestedParams) {
            expoParams[key] = nestedParams[key];
        }
    }
    return expoParams;
}
function removeInternalExpoRouterParams(params) {
    if (!params) {
        return undefined;
    }
    const newNestedParams = 'params' in params && typeof params.params === 'object' && params.params
        ? Object.fromEntries(Object.entries(params.params).filter(([key]) => !internalExpoRouterParamNames.includes(key)))
        : {};
    const newParams = Object.fromEntries(Object.entries(params).filter(([key]) => !internalExpoRouterParamNames.includes(key) &&
        key !== 'params'));
    if (Object.keys(newNestedParams).length > 0) {
        return { ...newParams, params: newNestedParams };
    }
    return newParams;
}
//# sourceMappingURL=navigationParams.js.map