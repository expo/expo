import { getRouteInfoFromState } from './getRouteInfoFromState';
const routeInfoCache = new WeakMap();
const routeInfoValuesCache = new Map();
export function getCachedRouteInfo(state) {
    let routeInfo = routeInfoCache.get(state);
    if (!routeInfo) {
        routeInfo = getRouteInfoFromState(state);
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
export function setCachedRouteInfo(state, routeInfo) {
    routeInfoCache.set(state, routeInfo);
    routeInfoValuesCache.set(JSON.stringify(routeInfo), routeInfo);
}
export const routeInfoSubscribers = new Set();
export const routeInfoSubscribe = (callback) => {
    routeInfoSubscribers.add(callback);
    return () => {
        routeInfoSubscribers.delete(callback);
    };
};
//# sourceMappingURL=routeInfoCache.js.map