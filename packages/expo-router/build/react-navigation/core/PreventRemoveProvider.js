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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreventRemoveProvider = PreventRemoveProvider;
const non_secure_1 = require("nanoid/non-secure");
const React = __importStar(require("react"));
const NavigationHelpersContext_1 = require("./NavigationHelpersContext");
const NavigationProvider_1 = require("./NavigationProvider");
const PreventRemoveContext_1 = require("./PreventRemoveContext");
const useLatestCallback_1 = __importDefault(require("../../utils/useLatestCallback"));
/**
 * Util function to transform map of prevented routes to a simpler object.
 */
const transformPreventedRoutes = (preventedRoutesMap) => {
    const preventedRoutesToTransform = [...preventedRoutesMap.values()];
    const preventedRoutes = preventedRoutesToTransform.reduce((acc, { routeKey, preventRemove }) => {
        acc[routeKey] = {
            preventRemove: acc[routeKey]?.preventRemove || preventRemove,
        };
        return acc;
    }, {});
    return preventedRoutes;
};
/**
 * Component used for managing which routes have to be prevented from removal in native-stack.
 */
function PreventRemoveProvider({ children }) {
    'use no memo';
    const [parentId] = React.useState(() => (0, non_secure_1.nanoid)());
    const [preventedRoutesMap, setPreventedRoutesMap] = React.useState(() => new Map());
    const navigation = React.useContext(NavigationHelpersContext_1.NavigationHelpersContext);
    const route = React.useContext(NavigationProvider_1.NavigationRouteContext);
    const preventRemoveContextValue = React.useContext(PreventRemoveContext_1.PreventRemoveContext);
    // take `setPreventRemove` from parent context - if exist it means we're in a nested context
    const setParentPrevented = preventRemoveContextValue?.setPreventRemove;
    // TODO(@ubax): RN Migration - For some reason this breaks with react compiler
    const setPreventRemove = (0, useLatestCallback_1.default)((id, routeKey, preventRemove) => {
        if (preventRemove &&
            (navigation == null ||
                navigation?.getState().routes.every((route) => route.key !== routeKey))) {
            throw new Error(`Couldn't find a route with the key ${routeKey}. Is your component inside NavigationContent?`);
        }
        setPreventedRoutesMap((prevPrevented) => {
            // values haven't changed - do nothing
            if (routeKey === prevPrevented.get(id)?.routeKey &&
                preventRemove === prevPrevented.get(id)?.preventRemove) {
                return prevPrevented;
            }
            const nextPrevented = new Map(prevPrevented);
            if (preventRemove) {
                nextPrevented.set(id, {
                    routeKey,
                    preventRemove,
                });
            }
            else {
                nextPrevented.delete(id);
            }
            return nextPrevented;
        });
    });
    const isPrevented = [...preventedRoutesMap.values()].some(({ preventRemove }) => preventRemove);
    React.useEffect(() => {
        if (route?.key !== undefined && setParentPrevented !== undefined) {
            // when route is defined (and setParentPrevented) it means we're in a nested stack
            // route.key then will be the route key of parent
            setParentPrevented(parentId, route.key, isPrevented);
            return () => {
                setParentPrevented(parentId, route.key, false);
            };
        }
        return undefined;
    }, [parentId, isPrevented, route?.key, setParentPrevented]);
    const value = React.useMemo(() => ({
        setPreventRemove,
        preventedRoutes: transformPreventedRoutes(preventedRoutesMap),
    }), [setPreventRemove, preventedRoutesMap]);
    return <PreventRemoveContext_1.PreventRemoveContext.Provider value={value}>{children}</PreventRemoveContext_1.PreventRemoveContext.Provider>;
}
//# sourceMappingURL=PreventRemoveProvider.js.map