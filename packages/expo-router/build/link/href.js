"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveHref = void 0;
/** Resolve an href object into a fully qualified, relative href. */
const resolveHref = (href) => {
    if (typeof href === 'string') {
        return (0, exports.resolveHref)({ pathname: href ?? '' });
    }
    const path = href.pathname ?? '';
    if (!href?.params) {
        return path;
    }
    const { pathname, params } = createQualifiedPathname(path, {
        ...href.params,
    });
    const paramsString = createQueryParams(params);
    return pathname + (paramsString ? `?${paramsString}` : '');
};
exports.resolveHref = resolveHref;
function createQualifiedPathname(pathname, params) {
    for (const [key, value = ''] of Object.entries(params)) {
        const dynamicKey = `[${key}]`;
        const deepDynamicKey = `[...${key}]`;
        if (pathname.includes(dynamicKey)) {
            pathname = pathname.replace(dynamicKey, encodeParam(value));
        }
        else if (pathname.includes(deepDynamicKey)) {
            pathname = pathname.replace(deepDynamicKey, encodeParam(value));
        }
        else {
            continue;
        }
        delete params[key];
    }
    return { pathname, params };
}
function encodeParam(param) {
    if (Array.isArray(param)) {
        return param.map((p) => encodeParam(p)).join('/');
    }
    return encodeURIComponent(param.toString());
}
function createQueryParams(params) {
    return (Object.entries(params)
        // Allow nullish params
        .filter(([, value]) => value != null)
        .map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`)
        .join('&'));
}
//# sourceMappingURL=href.js.map