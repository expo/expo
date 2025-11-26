"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME = exports.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME = exports.INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME = exports.INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME = void 0;
exports.appendInternalExpoRouterParams = appendInternalExpoRouterParams;
exports.getInternalExpoRouterParams = getInternalExpoRouterParams;
exports.hasParam = hasParam;
exports.removeParams = removeParams;
exports.removeInternalExpoRouterParams = removeInternalExpoRouterParams;
exports.INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME = '__internal_expo_router_no_animation';
exports.INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME = '__internal__expo_router_is_preview_navigation';
exports.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME = '__internal_expo_router_zoom_transition_source_id';
exports.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME = '__internal_expo_router_zoom_transition_screen_id';
const internalExpoRouterParamNames = [
    exports.INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
    exports.INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
    exports.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
    exports.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
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
function hasParam(params, paramName) {
    if (!!params && typeof params === 'object') {
        const recordParams = params;
        if (recordParams[paramName] !== undefined) {
            return true;
        }
        if (recordParams.params && typeof recordParams.params === 'object') {
            return hasParam(recordParams.params, paramName);
        }
    }
    return false;
}
function removeParams(params, paramName) {
    if (!params) {
        return undefined;
    }
    const nestedParams = 'params' in params && typeof params.params === 'object' && params.params
        ? params.params
        : undefined;
    const newNestedParams = nestedParams ? removeParams(nestedParams, paramName) : undefined;
    const newParams = Object.fromEntries(Object.entries(params).filter(([key]) => !paramName.includes(key) && key !== 'params'));
    if (Object.keys(newNestedParams ?? {}).length > 0) {
        return { ...newParams, params: newNestedParams };
    }
    return newParams;
}
function removeInternalExpoRouterParams(params) {
    if (!params) {
        return undefined;
    }
    return removeParams(params, [...internalExpoRouterParamNames, 'params']);
}
//# sourceMappingURL=navigationParams.js.map