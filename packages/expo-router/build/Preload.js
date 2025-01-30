"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Preload = void 0;
const react_1 = require("react");
const imperative_api_1 = require("./imperative-api");
const useLoadedNavigation_1 = require("./link/useLoadedNavigation");
/**
 * When rendered on a focused screen, this component will preload the specified route.
 */
function Preload(props) {
    const navigation = (0, useLoadedNavigation_1.useOptionalNavigation)();
    (0, react_1.useEffect)(() => {
        if (navigation?.isFocused()) {
            imperative_api_1.router.preload(props.href);
        }
    }, [navigation, props.href]);
    return null;
}
exports.Preload = Preload;
//# sourceMappingURL=Preload.js.map