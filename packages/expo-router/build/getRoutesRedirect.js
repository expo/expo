"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedirectModule = void 0;
const hooks_1 = require("./hooks");
const Link_1 = require("./link/Link");
const matchers_1 = require("./matchers");
function getRedirectModule(route) {
    return {
        default: function RedirectComponent() {
            const params = (0, hooks_1.useGlobalSearchParams)();
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
            return <Link_1.Redirect href={href}/>;
        },
    };
}
exports.getRedirectModule = getRedirectModule;
//# sourceMappingURL=getRoutesRedirect.js.map