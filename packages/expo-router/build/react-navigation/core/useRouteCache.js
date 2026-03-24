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
exports.CHILD_STATE = void 0;
exports.useRouteCache = useRouteCache;
const React = __importStar(require("react"));
const isRecordEqual_1 = require("./isRecordEqual");
/**
 * Utilities such as `getFocusedRouteNameFromRoute` need to access state.
 * So we need a way to suppress the warning for those use cases.
 * This is fine since they are internal utilities and this is not public API.
 */
exports.CHILD_STATE = Symbol('CHILD_STATE');
/**
 * Hook to cache route props for each screen in the navigator.
 * This lets add warnings and modifications to the route object but keep references between renders.
 */
function useRouteCache(routes) {
    // Cache object which holds route objects for each screen
    const cache = React.useMemo(() => ({ current: new Map() }), []);
    cache.current = routes.reduce((acc, route) => {
        const previous = cache.current.get(route.key);
        const { state, ...routeWithoutState } = route;
        let proxy;
        if (previous && (0, isRecordEqual_1.isRecordEqual)(previous, routeWithoutState)) {
            // If a cached route object already exists, reuse it
            proxy = previous;
        }
        else {
            proxy = routeWithoutState;
        }
        if (process.env.NODE_ENV !== 'production') {
            // FIXME: since the state is updated with mutation, the route object cannot be frozen
            // As a workaround, loop through the object and make the properties readonly
            for (const key in proxy) {
                // @ts-expect-error: this is fine since we are looping through the object
                const value = proxy[key];
                Object.defineProperty(proxy, key, {
                    enumerable: true,
                    configurable: true,
                    writable: false,
                    value,
                });
            }
        }
        Object.defineProperty(proxy, exports.CHILD_STATE, {
            enumerable: false,
            configurable: true,
            value: state,
        });
        acc.set(route.key, proxy);
        return acc;
    }, new Map());
    return Array.from(cache.current.values());
}
//# sourceMappingURL=useRouteCache.js.map