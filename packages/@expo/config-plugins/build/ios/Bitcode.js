"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withCustomBitcode = exports.withBitcode = exports.setBitcodeWithConfig = exports.setBitcode = exports.getBitcode = void 0;
function AppleImpl() {
  const data = _interopRequireWildcard(require("../apple/Bitcode"));
  AppleImpl = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * Plugin to set a bitcode preference for the Xcode project
 * based on the project's Expo config `ios.bitcode` value.
 */
const withBitcode = exports.withBitcode = AppleImpl().withBitcode('ios');

/**
 * Plugin to set a custom bitcode preference for the Xcode project.
 * Does not read from the Expo config `ios.bitcode`.
 *
 * @param bitcode custom bitcode setting.
 */
const withCustomBitcode = exports.withCustomBitcode = AppleImpl().withCustomBitcode('ios');

/**
 * Get the bitcode preference from the Expo config.
 */
const getBitcode = exports.getBitcode = AppleImpl().getBitcode('ios');

/**
 * Enable or disable the `ENABLE_BITCODE` property of the project configurations.
 */
const setBitcodeWithConfig = exports.setBitcodeWithConfig = AppleImpl().setBitcodeWithConfig('ios');

/**
 * Enable or disable the `ENABLE_BITCODE` property.
 */
const setBitcode = exports.setBitcode = AppleImpl().setBitcode('ios');
//# sourceMappingURL=Bitcode.js.map