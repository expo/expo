"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "LANDSCAPE_ORIENTATIONS", {
  enumerable: true,
  get: function () {
    return AppleImpl().LANDSCAPE_ORIENTATIONS;
  }
});
Object.defineProperty(exports, "PORTRAIT_ORIENTATIONS", {
  enumerable: true,
  get: function () {
    return AppleImpl().PORTRAIT_ORIENTATIONS;
  }
});
Object.defineProperty(exports, "getOrientation", {
  enumerable: true,
  get: function () {
    return AppleImpl().getOrientation;
  }
});
Object.defineProperty(exports, "setOrientation", {
  enumerable: true,
  get: function () {
    return AppleImpl().setOrientation;
  }
});
exports.withOrientation = void 0;
function AppleImpl() {
  const data = _interopRequireWildcard(require("../apple/Orientation"));
  AppleImpl = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const withOrientation = exports.withOrientation = AppleImpl().withOrientation('macos');
//# sourceMappingURL=Orientation.js.map