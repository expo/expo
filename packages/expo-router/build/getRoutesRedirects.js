"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirectModule = void 0;
const hooks_1 = require("./hooks");
const Link_1 = require("./link/Link");
const matchers_1 = require("./matchers");
function redirectModule(redirect) {
    return {
        default: function RedirectComponent() {
            const params = (0, hooks_1.useGlobalSearchParams)();
            const href = redirect.destination
                .split('/')
                .map((part) => {
                const match = (0, matchers_1.matchDynamicName)(part);
                return match ? params[match] : part;
            })
                .filter(Boolean)
                .join('/');
            return <Link_1.Redirect href={href}/>;
        },
    };
}
exports.redirectModule = redirectModule;
//# sourceMappingURL=getRoutesRedirects.js.map