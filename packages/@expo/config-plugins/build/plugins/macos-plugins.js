"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withXcodeProject = exports.withPodfileProperties = exports.withPodfile = exports.withInfoPlist = exports.withExpoPlist = exports.withEntitlementsPlist = exports.withAppDelegate = exports.createInfoPlistPluginWithPropertyGuard = exports.createInfoPlistPlugin = exports.createEntitlementsPlugin = void 0;
function ApplePlugins() {
  const data = _interopRequireWildcard(require("./apple-plugins"));
  ApplePlugins = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
const createInfoPlistPlugin = exports.createInfoPlistPlugin = ApplePlugins().createInfoPlistPlugin('macos');

/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
const createEntitlementsPlugin = exports.createEntitlementsPlugin = ApplePlugins().createEntitlementsPlugin('macos');
const createInfoPlistPluginWithPropertyGuard = exports.createInfoPlistPluginWithPropertyGuard = ApplePlugins().createInfoPlistPluginWithPropertyGuard('macos');

/**
 * Provides the AppDelegate file for modification.
 *
 * @param config
 * @param action
 */
const withAppDelegate = exports.withAppDelegate = ApplePlugins().withAppDelegate('macos');

/**
 * Provides the Info.plist file for modification.
 * Keeps the config's expo.macos.infoPlist object in sync with the data.
 *
 * @param config
 * @param action
 */
const withInfoPlist = exports.withInfoPlist = ApplePlugins().withInfoPlist('macos');

/**
 * Provides the main .entitlements file for modification.
 * Keeps the config's expo.macos.entitlements object in sync with the data.
 *
 * @param config
 * @param action
 */
const withEntitlementsPlist = exports.withEntitlementsPlist = ApplePlugins().withEntitlementsPlist('macos');

/**
 * Provides the Expo.plist for modification.
 *
 * @param config
 * @param action
 */
const withExpoPlist = exports.withExpoPlist = ApplePlugins().withExpoPlist('macos');

/**
 * Provides the main .xcodeproj for modification.
 *
 * @param config
 * @param action
 */
const withXcodeProject = exports.withXcodeProject = ApplePlugins().withXcodeProject('macos');

/**
 * Provides the Podfile for modification.
 *
 * @param config
 * @param action
 */
const withPodfile = exports.withPodfile = ApplePlugins().withPodfile('macos');

/**
 * Provides the Podfile.properties.json for modification.
 *
 * @param config
 * @param action
 */
const withPodfileProperties = exports.withPodfileProperties = ApplePlugins().withPodfileProperties('macos');
//# sourceMappingURL=macos-plugins.js.map