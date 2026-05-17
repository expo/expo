"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCurrentRouteInfo = useCurrentRouteInfo;
const react_1 = require("react");
const routeInfoCache_1 = require("../global-state/routeInfoCache");
const native_1 = require("../react-navigation/native");
/**
 * Returns route info for a screen it is called from.
 *
 * @experimental
 */
function useCurrentRouteInfo() {
    const state = (0, native_1.useStateForPath)();
    const routeInfo = (0, react_1.useMemo)(() => (state ? (0, routeInfoCache_1.getCachedRouteInfo)(state) : undefined), [state]);
    return routeInfo;
}
//# sourceMappingURL=useCurrentRouteInfo.js.map