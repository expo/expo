"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyRouteInfoSubscribers = exports.routeInfoSubscribe = exports.routeInfoSubscribers = void 0;
exports.getCachedRouteInfo = getCachedRouteInfo;
exports.setCachedRouteInfo = setCachedRouteInfo;
const getRouteInfoFromState_1 = require("./getRouteInfoFromState");
const routeInfoCache = new WeakMap();
const routeInfoValuesCache = new Map();
function getCachedRouteInfo(state) {
    let routeInfo = routeInfoCache.get(state);
    if (!routeInfo) {
        routeInfo = (0, getRouteInfoFromState_1.getRouteInfoFromState)(state);
        const routeInfoString = JSON.stringify(routeInfo);
        // Using cached values to avoid re-renders, to increase the chance that the object reference is the same
        const cachedRouteInfo = routeInfoValuesCache.get(routeInfoString);
        if (cachedRouteInfo) {
            routeInfo = cachedRouteInfo;
        }
        else {
            routeInfoValuesCache.set(routeInfoString, routeInfo);
        }
        routeInfoCache.set(state, routeInfo);
    }
    return routeInfo;
}
function setCachedRouteInfo(state, routeInfo) {
    routeInfoCache.set(state, routeInfo);
    routeInfoValuesCache.set(JSON.stringify(routeInfo), routeInfo);
}
// Route info is a *derived projection* of the navigation tree, finalized (with leaf-accurate focused
// params via setFocusedState) when the tree commits. Consumers subscribe to be re-rendered when it
// changes. This is intentionally a plain pub/sub, not `useSyncExternalStore` — `useRouteInfo`
// consumes it with useEffect + a reducer tick. (Flowing route info purely through context is a
// larger follow-up; see the RouteInfoContext design.)
exports.routeInfoSubscribers = new Set();
const routeInfoSubscribe = (callback) => {
    exports.routeInfoSubscribers.add(callback);
    return () => {
        exports.routeInfoSubscribers.delete(callback);
    };
};
exports.routeInfoSubscribe = routeInfoSubscribe;
const notifyRouteInfoSubscribers = () => {
    for (const callback of exports.routeInfoSubscribers) {
        callback();
    }
};
exports.notifyRouteInfoSubscribers = notifyRouteInfoSubscribers;
//# sourceMappingURL=routeInfoCache.js.map