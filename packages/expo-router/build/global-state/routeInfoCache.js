"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeInfoSubscribe = exports.routeInfoSubscribers = void 0;
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
exports.routeInfoSubscribers = new Set();
const routeInfoSubscribe = (callback) => {
    exports.routeInfoSubscribers.add(callback);
    return () => {
        exports.routeInfoSubscribers.delete(callback);
    };
};
exports.routeInfoSubscribe = routeInfoSubscribe;
//# sourceMappingURL=routeInfoCache.js.map