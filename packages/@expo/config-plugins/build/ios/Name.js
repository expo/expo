"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "getName", {
  enumerable: true,
  get: function () {
    return AppleImpl().getName;
  }
});
Object.defineProperty(exports, "setDisplayName", {
  enumerable: true,
  get: function () {
    return AppleImpl().setDisplayName;
  }
});
Object.defineProperty(exports, "setName", {
  enumerable: true,
  get: function () {
    return AppleImpl().setName;
  }
});
Object.defineProperty(exports, "setProductName", {
  enumerable: true,
  get: function () {
    return AppleImpl().setProductName;
  }
});
exports.withProductName = exports.withName = exports.withDisplayName = void 0;
function AppleImpl() {
  const data = _interopRequireWildcard(require("../apple/Name"));
  AppleImpl = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const withDisplayName = exports.withDisplayName = AppleImpl().withDisplayName('ios');
const withName = exports.withName = AppleImpl().withName('ios');

/** Set the PRODUCT_NAME variable in the xcproj file based on the app.json name property. */
const withProductName = exports.withProductName = AppleImpl().withProductName('ios');
//# sourceMappingURL=Name.js.map