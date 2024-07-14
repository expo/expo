"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "TargetType", {
  enumerable: true,
  get: function () {
    return AppleImpl().TargetType;
  }
});
exports.findApplicationTargetWithDependenciesAsync = void 0;
Object.defineProperty(exports, "findFirstNativeTarget", {
  enumerable: true,
  get: function () {
    return AppleImpl().findFirstNativeTarget;
  }
});
Object.defineProperty(exports, "findNativeTargetByName", {
  enumerable: true,
  get: function () {
    return AppleImpl().findNativeTargetByName;
  }
});
Object.defineProperty(exports, "findSignableTargets", {
  enumerable: true,
  get: function () {
    return AppleImpl().findSignableTargets;
  }
});
Object.defineProperty(exports, "getNativeTargets", {
  enumerable: true,
  get: function () {
    return AppleImpl().getNativeTargets;
  }
});
Object.defineProperty(exports, "getXCBuildConfigurationFromPbxproj", {
  enumerable: true,
  get: function () {
    return AppleImpl().getXCBuildConfigurationFromPbxproj;
  }
});
Object.defineProperty(exports, "isTargetOfType", {
  enumerable: true,
  get: function () {
    return AppleImpl().isTargetOfType;
  }
});
function AppleImpl() {
  const data = _interopRequireWildcard(require("../apple/Target"));
  AppleImpl = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const findApplicationTargetWithDependenciesAsync = exports.findApplicationTargetWithDependenciesAsync = AppleImpl().findApplicationTargetWithDependenciesAsync('macos');
//# sourceMappingURL=Target.js.map