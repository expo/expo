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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortRoutes = exports.sortRoutesWithInitial = exports.Route = exports.useContextKey = exports.useRouteNode = void 0;
const react_1 = __importStar(require("react"));
const matchers_1 = require("./matchers");
const sortRoutes_1 = require("./sortRoutes");
Object.defineProperty(exports, "sortRoutesWithInitial", { enumerable: true, get: function () { return sortRoutes_1.sortRoutesWithInitial; } });
Object.defineProperty(exports, "sortRoutes", { enumerable: true, get: function () { return sortRoutes_1.sortRoutes; } });
const CurrentRouteContext = react_1.default.createContext(null);
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
function Route({ children, node }) {
    return react_1.default.createElement(CurrentRouteContext.Provider, { value: node }, children);
}
exports.Route = Route;
//# sourceMappingURL=Route.js.map