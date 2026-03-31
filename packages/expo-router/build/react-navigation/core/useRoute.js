"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRoute = useRoute;
const react_1 = require("react");
const NavigationProvider_1 = require("./NavigationProvider");
/**
 * Hook to access the route prop of the parent screen anywhere.
 *
 * @returns Route prop of the parent screen.
 */
function useRoute() {
    const route = (0, react_1.use)(NavigationProvider_1.NavigationRouteContext);
    if (route === undefined) {
        throw new Error("Couldn't find a route object. Is your component inside a screen in a navigator?");
    }
    return route;
}
//# sourceMappingURL=useRoute.js.map