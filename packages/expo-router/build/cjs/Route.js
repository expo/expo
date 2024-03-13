"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Route = Route;
Object.defineProperty(exports, "sortRoutes", {
  enumerable: true,
  get: function () {
    return _sortRoutes().sortRoutes;
  }
});
Object.defineProperty(exports, "sortRoutesWithInitial", {
  enumerable: true,
  get: function () {
    return _sortRoutes().sortRoutesWithInitial;
  }
});
exports.useContextKey = useContextKey;
exports.useRouteNode = useRouteNode;
function _react() {
  const data = _interopRequireWildcard(require("react"));
  _react = function () {
    return data;
  };
  return data;
}
function _matchers() {
  const data = require("./matchers");
  _matchers = function () {
    return data;
  };
  return data;
}
function _sortRoutes() {
  const data = require("./sortRoutes");
  _sortRoutes = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const CurrentRouteContext = /*#__PURE__*/_react().default.createContext(null);
if (process.env.NODE_ENV !== 'production') {
  CurrentRouteContext.displayName = 'RouteNode';
}

/** Return the RouteNode at the current contextual boundary. */
function useRouteNode() {
  return (0, _react().useContext)(CurrentRouteContext);
}
function useContextKey() {
  const node = useRouteNode();
  if (node == null) {
    throw new Error('No filename found. This is likely a bug in expo-router.');
  }
  return (0, _matchers().getContextKey)(node.contextKey);
}

/** Provides the matching routes and filename to the children. */
function Route({
  children,
  node
}) {
  return /*#__PURE__*/_react().default.createElement(CurrentRouteContext.Provider, {
    value: node
  }, children);
}
//# sourceMappingURL=Route.js.map