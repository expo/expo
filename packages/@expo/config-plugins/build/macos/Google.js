"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withGoogleServicesFile = exports.withGoogle = exports.setGoogleSignInReversedClientId = exports.setGoogleServicesFile = exports.setGoogleConfig = exports.getGoogleSignInReversedClientId = exports.getGoogleServicesFile = void 0;
function AppleImpl() {
  const data = _interopRequireWildcard(require("../apple/Google"));
  AppleImpl = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const withGoogle = exports.withGoogle = AppleImpl().withGoogle('macos');
const withGoogleServicesFile = exports.withGoogleServicesFile = AppleImpl().withGoogleServicesFile('macos');
const getGoogleSignInReversedClientId = exports.getGoogleSignInReversedClientId = AppleImpl().getGoogleSignInReversedClientId('macos');
const getGoogleServicesFile = exports.getGoogleServicesFile = AppleImpl().getGoogleServicesFile('macos');
const setGoogleSignInReversedClientId = exports.setGoogleSignInReversedClientId = AppleImpl().setGoogleSignInReversedClientId('macos');
const setGoogleConfig = exports.setGoogleConfig = AppleImpl().setGoogleConfig('macos');
const setGoogleServicesFile = exports.setGoogleServicesFile = AppleImpl().setGoogleServicesFile('macos');
//# sourceMappingURL=Google.js.map