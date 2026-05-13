"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStateForPath = useStateForPath;
const react_1 = require("react");
const NavigationFocusedRouteStateContext_1 = require("./NavigationFocusedRouteStateContext");
/**
 * Hook to get a minimal state representation for the current route.
 * The returned state can be used with `getPathFromState` to build a path.
 *
 * @returns Minimal state to build a path for the current route.
 */
function useStateForPath() {
    const state = (0, react_1.use)(NavigationFocusedRouteStateContext_1.NavigationFocusedRouteStateContext);
    return state;
}
//# sourceMappingURL=useStateForPath.js.map