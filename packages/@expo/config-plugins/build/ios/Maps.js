"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "MATCH_INIT", {
  enumerable: true,
  get: function () {
    return AppleImpl().MATCH_INIT;
  }
});
Object.defineProperty(exports, "addGoogleMapsAppDelegateImport", {
  enumerable: true,
  get: function () {
    return AppleImpl().addGoogleMapsAppDelegateImport;
  }
});
Object.defineProperty(exports, "addGoogleMapsAppDelegateInit", {
  enumerable: true,
  get: function () {
    return AppleImpl().addGoogleMapsAppDelegateInit;
  }
});
Object.defineProperty(exports, "addMapsCocoaPods", {
  enumerable: true,
  get: function () {
    return AppleImpl().addMapsCocoaPods;
  }
});
exports.getGoogleMapsApiKey = void 0;
Object.defineProperty(exports, "removeGoogleMapsAppDelegateImport", {
  enumerable: true,
  get: function () {
    return AppleImpl().removeGoogleMapsAppDelegateImport;
  }
});
Object.defineProperty(exports, "removeGoogleMapsAppDelegateInit", {
  enumerable: true,
  get: function () {
    return AppleImpl().removeGoogleMapsAppDelegateInit;
  }
});
Object.defineProperty(exports, "removeMapsCocoaPods", {
  enumerable: true,
  get: function () {
    return AppleImpl().removeMapsCocoaPods;
  }
});
exports.withMaps = exports.setGoogleMapsApiKey = void 0;
function AppleImpl() {
  const data = _interopRequireWildcard(require("../apple/Maps"));
  AppleImpl = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const withMaps = exports.withMaps = AppleImpl().withMaps('ios');
const getGoogleMapsApiKey = exports.getGoogleMapsApiKey = AppleImpl().getGoogleMapsApiKey('ios');
const setGoogleMapsApiKey = exports.setGoogleMapsApiKey = AppleImpl().setGoogleMapsApiKey('ios');
//# sourceMappingURL=Maps.js.map