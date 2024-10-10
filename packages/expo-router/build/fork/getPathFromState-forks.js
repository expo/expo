"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDynamicPart = exports.getParamName = exports.getPathWithConventionsCollapsed = exports.appendBaseUrl = exports.appendQueryAndHash = exports.fixCurrentParams = exports.validatePathConfig = void 0;
const native_1 = require("@react-navigation/native");
const queryString = __importStar(require("query-string"));
const matchers_1 = require("../matchers");
function validatePathConfig({ preserveDynamicRoutes, preserveGroups, shouldEncodeURISegment, ...options }) {
    (0, native_1.validatePathConfig)(options);
}
exports.validatePathConfig = validatePathConfig;
function fixCurrentParams(allParams, route, stringify) {
    // Better handle array params
    const currentParams = Object.fromEntries(Object.entries(route.params).flatMap(([key, value]) => {
        if (key === 'screen' || key === 'params') {
            return [];
        }
        return [
            [
                key,
                stringify?.[key]
                    ? stringify[key](value)
                    : Array.isArray(value)
                        ? value.map(String)
                        : String(value),
            ],
        ];
    }));
    // We always assign params, as non pattern routes may still have query params
    Object.assign(allParams, currentParams);
    return currentParams;
}
exports.fixCurrentParams = fixCurrentParams;
function appendQueryAndHash(path, { '#': hash, ...focusedParams }) {
    const query = queryString.stringify(focusedParams, { sort: false });
    if (query) {
        path += `?${query}`;
    }
    if (hash) {
        path += `#${hash}`;
    }
    return path;
}
exports.appendQueryAndHash = appendQueryAndHash;
function appendBaseUrl(path, baseUrl = process.env.EXPO_BASE_URL) {
    if (process.env.NODE_ENV !== 'development') {
        if (baseUrl) {
            return `/${baseUrl.replace(/^\/+/, '').replace(/\/$/, '')}${path}`;
        }
    }
    return path;
}
exports.appendBaseUrl = appendBaseUrl;
function getPathWithConventionsCollapsed({ pattern, route, params, preserveGroups, preserveDynamicRoutes, shouldEncodeURISegment = true, initialRouteName, }) {
    const segments = pattern.split('/');
    // console.log({ segments, params });
    return segments
        .map((p, i) => {
        const name = (0, exports.getParamName)(p);
        // Showing the route name seems ok, though whatever we show here will be incorrect
        // Since the page doesn't actually exist
        if (p.startsWith('*')) {
            if (preserveDynamicRoutes) {
                if (name === 'not-found') {
                    return '+not-found';
                }
                return `[...${name}]`;
            }
            else if (params[name]) {
                if (Array.isArray(params[name])) {
                    return params[name].join('/');
                }
                return params[name];
            }
            else if (route.name.startsWith('[') && route.name.endsWith(']')) {
                return '';
            }
            else if (p === '*not-found') {
                return '';
            }
            else {
                return route.name;
            }
        }
        // If the path has a pattern for a param, put the param in the path
        if (p.startsWith(':')) {
            if (preserveDynamicRoutes) {
                return `[${name}]`;
            }
            // Optional params without value assigned in route.params should be ignored
            const value = params[name];
            if (value === undefined && p.endsWith('?')) {
                return;
            }
            return (shouldEncodeURISegment ? encodeURISegment(value) : value) ?? 'undefined';
        }
        if (!preserveGroups && (0, matchers_1.matchGroupName)(p) != null) {
            // When the last part is a group it could be a shared URL
            // if the route has an initialRouteName defined, then we should
            // use that as the component path as we can assume it will be shown.
            if (segments.length - 1 === i) {
                if (initialRouteName) {
                    // Return an empty string if the init route is ambiguous.
                    if (segmentMatchesConvention(initialRouteName)) {
                        return '';
                    }
                    return shouldEncodeURISegment
                        ? encodeURISegment(initialRouteName, { preserveBrackets: true })
                        : initialRouteName;
                }
            }
            return '';
        }
        // Preserve dynamic syntax for rehydration
        return shouldEncodeURISegment ? encodeURISegment(p, { preserveBrackets: true }) : p;
    })
        .map((v) => v ?? '')
        .join('/');
}
exports.getPathWithConventionsCollapsed = getPathWithConventionsCollapsed;
const getParamName = (pattern) => pattern.replace(/^[:*]/, '').replace(/\?$/, '');
exports.getParamName = getParamName;
function isDynamicPart(p) {
    return p.startsWith(':') || p.startsWith('*');
}
exports.isDynamicPart = isDynamicPart;
function segmentMatchesConvention(segment) {
    return (segment === 'index' ||
        (0, matchers_1.matchDynamicName)(segment) != null ||
        (0, matchers_1.matchGroupName)(segment) != null ||
        (0, matchers_1.matchDeepDynamicRouteName)(segment) != null);
}
function encodeURISegment(str, { preserveBrackets = false } = {}) {
    // Valid characters according to
    // https://datatracker.ietf.org/doc/html/rfc3986#section-3.3 (see pchar definition)
    str = String(str).replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]/g, (char) => encodeURIComponent(char));
    if (preserveBrackets) {
        // Preserve brackets
        str = str.replace(/%5B/g, '[').replace(/%5D/g, ']');
    }
    return str;
}
//# sourceMappingURL=getPathFromState-forks.js.map