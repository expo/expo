"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldPreventRemove = void 0;
exports.useOnPreventRemove = useOnPreventRemove;
const React = __importStar(require("react"));
const NavigationBuilderContext_1 = require("./NavigationBuilderContext");
const NavigationProvider_1 = require("./NavigationProvider");
const VISITED_ROUTE_KEYS = Symbol('VISITED_ROUTE_KEYS');
const shouldPreventRemove = (emitter, beforeRemoveListeners, currentRoutes, nextRoutes, action) => {
    const nextRouteKeys = nextRoutes.map((route) => route.key);
    // Call these in reverse order so last screens handle the event first
    const removedRoutes = currentRoutes
        .filter((route) => !nextRouteKeys.includes(route.key))
        .reverse();
    const visitedRouteKeys = 
    // @ts-expect-error: add this property to mark that we've already emitted this action
    action[VISITED_ROUTE_KEYS] ?? new Set();
    const beforeRemoveAction = {
        ...action,
        [VISITED_ROUTE_KEYS]: visitedRouteKeys,
    };
    for (const route of removedRoutes) {
        if (visitedRouteKeys.has(route.key)) {
            // Skip if we've already emitted this action for this screen
            continue;
        }
        // First, we need to check if any child screens want to prevent it
        const isPrevented = beforeRemoveListeners[route.key]?.(beforeRemoveAction);
        if (isPrevented) {
            return true;
        }
        visitedRouteKeys.add(route.key);
        const event = emitter.emit({
            type: 'beforeRemove',
            target: route.key,
            data: { action: beforeRemoveAction },
            canPreventDefault: true,
        });
        if (event.defaultPrevented) {
            return true;
        }
    }
    return false;
};
exports.shouldPreventRemove = shouldPreventRemove;
function useOnPreventRemove({ getState, emitter, beforeRemoveListeners }) {
    const { addKeyedListener } = React.useContext(NavigationBuilderContext_1.NavigationBuilderContext);
    const route = React.useContext(NavigationProvider_1.NavigationRouteContext);
    const routeKey = route?.key;
    React.useEffect(() => {
        if (routeKey) {
            return addKeyedListener?.('beforeRemove', routeKey, (action) => {
                const state = getState();
                return (0, exports.shouldPreventRemove)(emitter, beforeRemoveListeners, state.routes, [], action);
            });
        }
    }, [addKeyedListener, beforeRemoveListeners, emitter, getState, routeKey]);
}
//# sourceMappingURL=useOnPreventRemove.js.map