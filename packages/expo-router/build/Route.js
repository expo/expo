'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortRoutes = exports.sortRoutesWithInitial = exports.Route = exports.useContextKey = exports.useRouteNode = exports.LocalRouteParamsContext = void 0;
const react_1 = require("react");
const matchers_1 = require("./matchers");
const sortRoutes_1 = require("./sortRoutes");
Object.defineProperty(exports, "sortRoutesWithInitial", { enumerable: true, get: function () { return sortRoutes_1.sortRoutesWithInitial; } });
Object.defineProperty(exports, "sortRoutes", { enumerable: true, get: function () { return sortRoutes_1.sortRoutes; } });
const CurrentRouteContext = (0, react_1.createContext)(null);
exports.LocalRouteParamsContext = (0, react_1.createContext)({});
if (process.env.NODE_ENV !== 'production') {
    CurrentRouteContext.displayName = 'RouteNode';
}
/** Return the RouteNode at the current contextual boundary. */
function useRouteNode() {
    return (0, react_1.useContext)(CurrentRouteContext);
}
exports.useRouteNode = useRouteNode;
function useContextKey() {
    const node = useRouteNode();
    if (node == null) {
        throw new Error('No filename found. This is likely a bug in expo-router.');
    }
    return (0, matchers_1.getContextKey)(node.contextKey);
}
exports.useContextKey = useContextKey;
/** Provides the matching routes and filename to the children. */
function Route({ children, node, route }) {
    return (<exports.LocalRouteParamsContext.Provider value={route?.params}>
      <CurrentRouteContext.Provider value={node}>{children}</CurrentRouteContext.Provider>
    </exports.LocalRouteParamsContext.Provider>);
}
exports.Route = Route;
//# sourceMappingURL=Route.js.map