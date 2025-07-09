"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prefetch = Prefetch;
const react_1 = require("react");
const imperative_api_1 = require("./imperative-api");
const useLoadedNavigation_1 = require("./link/useLoadedNavigation");
/**
 * When rendered on a focused screen, this component will preload the specified route.
 */
function Prefetch(props) {
    const navigation = (0, useLoadedNavigation_1.useOptionalNavigation)();
    (0, react_1.useLayoutEffect)(() => {
        if (navigation?.isFocused()) {
            imperative_api_1.router.prefetch(props.href);
        }
    }, [navigation, props.href]);
    return null;
}
//# sourceMappingURL=Prefetch.js.map