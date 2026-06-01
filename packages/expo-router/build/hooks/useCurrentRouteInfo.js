"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCurrentRouteInfo = useCurrentRouteInfo;
const react_1 = require("react");
const RouteInfoContext_1 = require("../global-state/RouteInfoContext");
/**
 * Returns route info for a screen it is called from.
 *
 * @experimental
 */
function useCurrentRouteInfo() {
    return (0, react_1.use)(RouteInfoContext_1.RouteInfoContext);
}
//# sourceMappingURL=useCurrentRouteInfo.js.map