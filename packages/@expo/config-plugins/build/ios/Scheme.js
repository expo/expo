"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "appendScheme", {
  enumerable: true,
  get: function () {
    return AppleImpl().appendScheme;
  }
});
Object.defineProperty(exports, "getScheme", {
  enumerable: true,
  get: function () {
    return AppleImpl().getScheme;
  }
});
Object.defineProperty(exports, "getSchemesFromPlist", {
  enumerable: true,
  get: function () {
    return AppleImpl().getSchemesFromPlist;
  }
});
Object.defineProperty(exports, "hasScheme", {
  enumerable: true,
  get: function () {
    return AppleImpl().hasScheme;
  }
});
Object.defineProperty(exports, "removeScheme", {
  enumerable: true,
  get: function () {
    return AppleImpl().removeScheme;
  }
});
exports.withScheme = exports.setScheme = void 0;
function AppleImpl() {
  const data = _interopRequireWildcard(require("../apple/Scheme"));
  AppleImpl = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const withScheme = exports.withScheme = AppleImpl().withScheme('ios');
const setScheme = exports.setScheme = AppleImpl().setScheme('ios');
//# sourceMappingURL=Scheme.js.map