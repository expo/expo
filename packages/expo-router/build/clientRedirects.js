"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertRedirect = exports.getRedirectModule = void 0;
const react_1 = require("react");
const router_store_1 = require("./global-state/router-store");
const Link_1 = require("./link/Link");
const matchers_1 = require("./matchers");
function getRedirectModule(route) {
    return {
        default: function RedirectComponent() {
            // Use the store directly instead of useGlobalSearchParams.
            // Importing the hooks directly causes build errors on the server
            const params = (0, router_store_1.useStoreRouteInfo)().params;
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
            return (0, react_1.createElement)(Link_1.Redirect, { href });
        },
    };
}
exports.getRedirectModule = getRedirectModule;
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
    return config.destination
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
exports.convertRedirect = convertRedirect;
//# sourceMappingURL=clientRedirects.js.map