"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedirectModule = getRedirectModule;
exports.convertRedirect = convertRedirect;
exports.mergeVariablesWithPath = mergeVariablesWithPath;
const react_1 = require("react");
const matchers_1 = require("./matchers");
function getRedirectModule(route) {
    return {
        default: function RedirectComponent() {
            // Use the store directly instead of useGlobalSearchParams.
            // Importing the hooks directly causes build errors on the server
            const params = require('./hooks').useGlobalSearchParams();
            // Replace dynamic parts of the route with the actual values from the params
            let href = route
                .split('/')
                .map((part) => {
                const match = (0, matchers_1.matchDynamicName)(part) || (0, matchers_1.matchDeepDynamicRouteName)(part);
                if (!match) {
                    return part;
                }
                const param = params[match];
                delete params[match];
                return param;
            })
                .filter(Boolean)
                .join('/');
            // Add any remaining params as query string
            const queryString = new URLSearchParams(params).toString();
            if (queryString) {
                href += `?${queryString}`;
            }
            return (0, react_1.createElement)(require('./link/Link').Redirect, { href });
        },
    };
}
function convertRedirect(path, config) {
    const params = {};
    const parts = path.split('/');
    const sourceParts = config.source.split('/');
    for (const [index, sourcePart] of sourceParts.entries()) {
        let match = (0, matchers_1.matchDynamicName)(sourcePart);
        if (match) {
            params[match] = parts[index];
            continue;
        }
        match = (0, matchers_1.matchDeepDynamicRouteName)(sourcePart);
        if (match) {
            params[match] = parts.slice(index);
            break;
        }
    }
    return mergeVariablesWithPath(config.destination, params);
}
function mergeVariablesWithPath(path, params) {
    return path
        .split('/')
        .map((part) => {
        const match = (0, matchers_1.matchDynamicName)(part) || (0, matchers_1.matchDeepDynamicRouteName)(part);
        if (!match) {
            return part;
        }
        const param = params[match];
        delete params[match];
        return param;
    })
        .filter(Boolean)
        .join('/');
}
//# sourceMappingURL=getRoutesRedirects.js.map