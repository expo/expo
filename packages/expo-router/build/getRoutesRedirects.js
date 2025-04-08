import { createElement } from 'react';
import { matchDeepDynamicRouteName, matchDynamicName } from './matchers';
export function getRedirectModule(route) {
    return {
        default: function RedirectComponent() {
            // Use the store directly instead of useGlobalSearchParams.
            // Importing the hooks directly causes build errors on the server
            const params = require('./hooks').useGlobalSearchParams();
            // Replace dynamic parts of the route with the actual values from the params
            let href = route
                .split('/')
                .map((part) => {
                const match = matchDynamicName(part) || matchDeepDynamicRouteName(part);
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
            return createElement(require('./link/Link').Redirect, { href });
        },
    };
}
export function convertRedirect(path, config) {
    const params = {};
    const parts = path.split('/');
    const sourceParts = config.source.split('/');
    for (const [index, sourcePart] of sourceParts.entries()) {
        let match = matchDynamicName(sourcePart);
        if (match) {
            params[match] = parts[index];
            continue;
        }
        match = matchDeepDynamicRouteName(sourcePart);
        if (match) {
            params[match] = parts.slice(index);
            break;
        }
    }
    return mergeVariablesWithPath(config.destination, params);
}
export function mergeVariablesWithPath(path, params) {
    return path
        .split('/')
        .map((part) => {
        const match = matchDynamicName(part) || matchDeepDynamicRouteName(part);
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