"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addFileToGroupAndLink = exports.addBuildSourceFileToGroup = void 0;
Object.defineProperty(exports, "addFramework", {
  enumerable: true,
  get: function () {
    return AppleImpl().addFramework;
  }
});
exports.addResourceFileToGroup = void 0;
Object.defineProperty(exports, "ensureGroupRecursively", {
  enumerable: true,
  get: function () {
    return AppleImpl().ensureGroupRecursively;
  }
});
Object.defineProperty(exports, "getApplicationNativeTarget", {
  enumerable: true,
  get: function () {
    return AppleImpl().getApplicationNativeTarget;
  }
});
Object.defineProperty(exports, "getBuildConfigurationForListIdAndName", {
  enumerable: true,
  get: function () {
    return AppleImpl().getBuildConfigurationForListIdAndName;
  }
});
Object.defineProperty(exports, "getBuildConfigurationsForListId", {
  enumerable: true,
  get: function () {
    return AppleImpl().getBuildConfigurationsForListId;
  }
});
exports.getPbxproj = exports.getHackyProjectName = void 0;
Object.defineProperty(exports, "getProductName", {
  enumerable: true,
  get: function () {
    return AppleImpl().getProductName;
  }
});
exports.getProjectName = void 0;
Object.defineProperty(exports, "getProjectSection", {
  enumerable: true,
  get: function () {
    return AppleImpl().getProjectSection;
  }
});
Object.defineProperty(exports, "getXCConfigurationListEntries", {
  enumerable: true,
  get: function () {
    return AppleImpl().getXCConfigurationListEntries;
  }
});
Object.defineProperty(exports, "isBuildConfig", {
  enumerable: true,
  get: function () {
    return AppleImpl().isBuildConfig;
  }
});
Object.defineProperty(exports, "isNotComment", {
  enumerable: true,
  get: function () {
    return AppleImpl().isNotComment;
  }
});
Object.defineProperty(exports, "isNotTestHost", {
  enumerable: true,
  get: function () {
    return AppleImpl().isNotTestHost;
  }
});
exports.resolvePathOrProject = void 0;
Object.defineProperty(exports, "resolveXcodeBuildSetting", {
  enumerable: true,
  get: function () {
    return AppleImpl().resolveXcodeBuildSetting;
  }
});
Object.defineProperty(exports, "sanitizedName", {
  enumerable: true,
  get: function () {
    return AppleImpl().sanitizedName;
  }
});
Object.defineProperty(exports, "unquote", {
  enumerable: true,
  get: function () {
    return AppleImpl().unquote;
  }
});
function AppleImpl() {
  const data = _interopRequireWildcard(require("../../apple/utils/Xcodeproj"));
  AppleImpl = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const getProjectName = exports.getProjectName = AppleImpl().getProjectName('ios');

// TODO: come up with a better solution for using app.json expo.name in various places
const resolvePathOrProject = exports.resolvePathOrProject = AppleImpl().resolvePathOrProject('ios');

// TODO: it's silly and kind of fragile that we look at app config to determine
// the ios/macos project paths. Overall this function needs to be revamped, just
// a placeholder for now! Make this more robust when we support applying config
// at any time (currently it's only applied on eject).
const getHackyProjectName = exports.getHackyProjectName = AppleImpl().getHackyProjectName('ios');

/**
 * Add a resource file (ex: `SplashScreen.storyboard`, `Images.xcassets`) to an Xcode project.
 * This is akin to creating a new code file in Xcode with `⌘+n`.
 */
const addResourceFileToGroup = exports.addResourceFileToGroup = AppleImpl().addResourceFileToGroup('ios');

/**
 * Add a build source file (ex: `AppDelegate.m`, `ViewController.swift`) to an Xcode project.
 * This is akin to creating a new code file in Xcode with `⌘+n`.
 */
const addBuildSourceFileToGroup = exports.addBuildSourceFileToGroup = AppleImpl().addBuildSourceFileToGroup('ios');

// TODO(brentvatne): I couldn't figure out how to do this with an existing
// higher level function exposed by the xcode library, but we should find out how to do
// that and replace this with it
const addFileToGroupAndLink = exports.addFileToGroupAndLink = AppleImpl().addFileToGroupAndLink('ios');

/**
 * Get the pbxproj for the given path
 */
const getPbxproj = exports.getPbxproj = AppleImpl().getPbxproj('ios');
//# sourceMappingURL=Xcodeproj.js.map