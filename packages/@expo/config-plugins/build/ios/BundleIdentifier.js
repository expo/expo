"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resetAllPlistBundleIdentifiers = exports.getBundleIdentifierFromPbxproj = exports.getBundleIdentifier = void 0;
Object.defineProperty(exports, "resetPlistBundleIdentifier", {
  enumerable: true,
  get: function () {
    return AppleImpl().resetPlistBundleIdentifier;
  }
});
exports.setBundleIdentifierForPbxproj = exports.setBundleIdentifier = void 0;
Object.defineProperty(exports, "updateBundleIdentifierForPbxproj", {
  enumerable: true,
  get: function () {
    return AppleImpl().updateBundleIdentifierForPbxproj;
  }
});
exports.withBundleIdentifier = void 0;
function AppleImpl() {
  const data = _interopRequireWildcard(require("../apple/BundleIdentifier"));
  AppleImpl = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const withBundleIdentifier = exports.withBundleIdentifier = AppleImpl().withBundleIdentifier('ios');
const getBundleIdentifier = exports.getBundleIdentifier = AppleImpl().getBundleIdentifier('ios');

/**
 * In Turtle v1 we set the bundleIdentifier directly on Info.plist rather
 * than in pbxproj
 */
const setBundleIdentifier = exports.setBundleIdentifier = AppleImpl().setBundleIdentifier('ios');

/**
 * Gets the bundle identifier defined in the Xcode project found in the project directory.
 *
 * A bundle identifier is stored as a value in XCBuildConfiguration entry.
 * Those entries exist for every pair (build target, build configuration).
 * Unless target name is passed, the first target defined in the pbxproj is used
 * (to keep compatibility with the inaccurate legacy implementation of this function).
 * The build configuration is usually 'Release' or 'Debug'. However, it could be any arbitrary string.
 * Defaults to 'Release'.
 *
 * @param {string} projectRoot Path to project root containing the ios directory
 * @param {string} targetName Target name
 * @param {string} buildConfiguration Build configuration. Defaults to 'Release'.
 * @returns {string | null} bundle identifier of the Xcode project or null if the project is not configured
 */
const getBundleIdentifierFromPbxproj = exports.getBundleIdentifierFromPbxproj = AppleImpl().getBundleIdentifierFromPbxproj('ios');

/**
 * Updates the bundle identifier for pbx projects inside the ios directory of the given project root
 *
 * @param {string} projectRoot Path to project root containing the ios directory
 * @param {string} bundleIdentifier Desired bundle identifier
 * @param {boolean} [updateProductName=true]  Whether to update PRODUCT_NAME
 */
const setBundleIdentifierForPbxproj = exports.setBundleIdentifierForPbxproj = AppleImpl().setBundleIdentifierForPbxproj('ios');
const resetAllPlistBundleIdentifiers = exports.resetAllPlistBundleIdentifiers = AppleImpl().resetAllPlistBundleIdentifiers('ios');
//# sourceMappingURL=BundleIdentifier.js.map