"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getExpoPlistPath = exports.getEntitlementsPath = exports.getAppDelegateObjcHeaderFilePath = exports.getAppDelegateHeaderFilePath = exports.getAppDelegateFilePath = exports.getAppDelegate = exports.getAllXcodeProjectPaths = exports.getAllPBXProjectPaths = exports.getAllInfoPlistPaths = exports.getAllEntitlementsPaths = exports.findSchemePaths = exports.findSchemeNames = void 0;
Object.defineProperty(exports, "getFileInfo", {
  enumerable: true,
  get: function () {
    return AppleImpl().getFileInfo;
  }
});
exports.getXcodeProjectPath = exports.getSupportingPath = exports.getSourceRoot = exports.getPodfilePath = exports.getPBXProjectPath = exports.getInfoPlistPath = void 0;
function AppleImpl() {
  const data = _interopRequireWildcard(require("../apple/Paths"));
  AppleImpl = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const getAppDelegateHeaderFilePath = exports.getAppDelegateHeaderFilePath = AppleImpl().getAppDelegateHeaderFilePath('macos');
const getAppDelegateFilePath = exports.getAppDelegateFilePath = AppleImpl().getAppDelegateFilePath('macos');
const getAppDelegateObjcHeaderFilePath = exports.getAppDelegateObjcHeaderFilePath = AppleImpl().getAppDelegateObjcHeaderFilePath('macos');
const getPodfilePath = exports.getPodfilePath = AppleImpl().getPodfilePath('macos');
const getAppDelegate = exports.getAppDelegate = AppleImpl().getAppDelegate('macos');
const getSourceRoot = exports.getSourceRoot = AppleImpl().getSourceRoot('macos');
const findSchemePaths = exports.findSchemePaths = AppleImpl().findSchemePaths('macos');
const findSchemeNames = exports.findSchemeNames = AppleImpl().findSchemeNames('macos');
const getAllXcodeProjectPaths = exports.getAllXcodeProjectPaths = AppleImpl().getAllXcodeProjectPaths('macos');
const getXcodeProjectPath = exports.getXcodeProjectPath = AppleImpl().getXcodeProjectPath('macos');
const getAllPBXProjectPaths = exports.getAllPBXProjectPaths = AppleImpl().getAllPBXProjectPaths('macos');
const getPBXProjectPath = exports.getPBXProjectPath = AppleImpl().getPBXProjectPath('macos');
const getAllInfoPlistPaths = exports.getAllInfoPlistPaths = AppleImpl().getAllInfoPlistPaths('macos');
const getInfoPlistPath = exports.getInfoPlistPath = AppleImpl().getInfoPlistPath('macos');
const getAllEntitlementsPaths = exports.getAllEntitlementsPaths = AppleImpl().getAllEntitlementsPaths('macos');
const getEntitlementsPath = exports.getEntitlementsPath = AppleImpl().getEntitlementsPath('macos');
const getSupportingPath = exports.getSupportingPath = AppleImpl().getSupportingPath('macos');
const getExpoPlistPath = exports.getExpoPlistPath = AppleImpl().getExpoPlistPath('macos');
//# sourceMappingURL=Paths.js.map