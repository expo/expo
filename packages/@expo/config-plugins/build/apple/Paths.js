"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findSchemeNames = findSchemeNames;
exports.findSchemePaths = findSchemePaths;
exports.getAllEntitlementsPaths = getAllEntitlementsPaths;
exports.getAllInfoPlistPaths = getAllInfoPlistPaths;
exports.getAllPBXProjectPaths = getAllPBXProjectPaths;
exports.getAllXcodeProjectPaths = getAllXcodeProjectPaths;
exports.getAppDelegate = getAppDelegate;
exports.getAppDelegateFilePath = getAppDelegateFilePath;
exports.getAppDelegateHeaderFilePath = getAppDelegateHeaderFilePath;
exports.getAppDelegateObjcHeaderFilePath = getAppDelegateObjcHeaderFilePath;
exports.getEntitlementsPath = getEntitlementsPath;
exports.getExpoPlistPath = getExpoPlistPath;
exports.getFileInfo = getFileInfo;
exports.getInfoPlistPath = getInfoPlistPath;
exports.getPBXProjectPath = getPBXProjectPath;
exports.getPodfilePath = getPodfilePath;
exports.getSourceRoot = getSourceRoot;
exports.getSupportingPath = getSupportingPath;
exports.getXcodeProjectPath = getXcodeProjectPath;
function _fs() {
  const data = require("fs");
  _fs = function () {
    return data;
  };
  return data;
}
function _glob() {
  const data = require("glob");
  _glob = function () {
    return data;
  };
  return data;
}
function path() {
  const data = _interopRequireWildcard(require("path"));
  path = function () {
    return data;
  };
  return data;
}
function Entitlements() {
  const data = _interopRequireWildcard(require("./Entitlements"));
  Entitlements = function () {
    return data;
  };
  return data;
}
function _errors() {
  const data = require("../utils/errors");
  _errors = function () {
    return data;
  };
  return data;
}
function _glob2() {
  const data = require("../utils/glob");
  _glob2 = function () {
    return data;
  };
  return data;
}
function _warnings() {
  const data = require("../utils/warnings");
  _warnings = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const ignoredPaths = ['**/@(Carthage|Pods|vendor|node_modules)/**'];
function getAppDelegateHeaderFilePath(projectRoot, applePlatform) {
  const applePlatformDir = applePlatform;
  const [using, ...extra] = (0, _glob2().withSortedGlobResult)((0, _glob().globSync)(`${applePlatformDir}/*/AppDelegate.h`, {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  }));
  if (!using) {
    throw new (_errors().UnexpectedError)(`Could not locate a valid AppDelegate header at root: "${projectRoot}"`);
  }
  if (extra.length) {
    warnMultipleFiles({
      applePlatform,
      tag: 'app-delegate-header',
      fileName: 'AppDelegate',
      projectRoot,
      using,
      extra
    });
  }
  return using;
}
function getAppDelegateFilePath(projectRoot, applePlatform) {
  const applePlatformDir = applePlatform;
  const [using, ...extra] = (0, _glob2().withSortedGlobResult)((0, _glob().globSync)(`${applePlatformDir}/*/AppDelegate.@(m|mm|swift)`, {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  }));
  if (!using) {
    throw new (_errors().UnexpectedError)(`Could not locate a valid AppDelegate at root: "${projectRoot}"`);
  }
  if (extra.length) {
    warnMultipleFiles({
      applePlatform,
      tag: 'app-delegate',
      fileName: 'AppDelegate',
      projectRoot,
      using,
      extra
    });
  }
  return using;
}
function getAppDelegateObjcHeaderFilePath(projectRoot, applePlatform) {
  const applePlatformDir = applePlatform;
  const [using, ...extra] = (0, _glob2().withSortedGlobResult)((0, _glob().globSync)(`${applePlatformDir}/*/AppDelegate.h`, {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  }));
  if (!using) {
    throw new (_errors().UnexpectedError)(`Could not locate a valid AppDelegate.h at root: "${projectRoot}"`);
  }
  if (extra.length) {
    warnMultipleFiles({
      applePlatform,
      tag: 'app-delegate-objc-header',
      fileName: 'AppDelegate.h',
      projectRoot,
      using,
      extra
    });
  }
  return using;
}
function getPodfilePath(projectRoot, applePlatform) {
  const applePlatformDir = applePlatform;
  const [using, ...extra] = (0, _glob2().withSortedGlobResult)((0, _glob().globSync)(`${applePlatformDir}/Podfile`, {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  }));
  if (!using) {
    throw new (_errors().UnexpectedError)(`Could not locate a valid Podfile at root: "${projectRoot}"`);
  }
  if (extra.length) {
    warnMultipleFiles({
      applePlatform,
      tag: 'podfile',
      fileName: 'Podfile',
      projectRoot,
      using,
      extra
    });
  }
  return using;
}
function getLanguage(filePath) {
  const extension = path().extname(filePath);
  if (!extension && path().basename(filePath) === 'Podfile') {
    return 'rb';
  }
  switch (extension) {
    case '.mm':
      return 'objcpp';
    case '.m':
    case '.h':
      return 'objc';
    case '.swift':
      return 'swift';
    default:
      throw new (_errors().UnexpectedError)(`Unexpected Apple file extension: ${extension}`);
  }
}
function getFileInfo(filePath) {
  return {
    path: path().normalize(filePath),
    contents: (0, _fs().readFileSync)(filePath, 'utf8'),
    language: getLanguage(filePath)
  };
}
function getAppDelegate(projectRoot, applePlatform) {
  const filePath = getAppDelegateFilePath(projectRoot, applePlatform);
  return getFileInfo(filePath);
}
function getSourceRoot(projectRoot, applePlatform) {
  const appDelegate = getAppDelegate(projectRoot, applePlatform);
  return path().dirname(appDelegate.path);
}
function findSchemePaths(projectRoot, applePlatform) {
  const applePlatformDir = applePlatform;
  return (0, _glob2().withSortedGlobResult)((0, _glob().globSync)(`${applePlatformDir}/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme`, {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  }));
}
function findSchemeNames(projectRoot, applePlatform) {
  const schemePaths = findSchemePaths(projectRoot, applePlatform);
  return schemePaths.map(schemePath => path().parse(schemePath).name);
}
function getAllXcodeProjectPaths(projectRoot, applePlatform) {
  const applePlatformDir = applePlatform;
  const pbxprojPaths = (0, _glob2().withSortedGlobResult)((0, _glob().globSync)(`${applePlatformDir}/**/*.xcodeproj`, {
    cwd: projectRoot,
    ignore: ignoredPaths
  })
  // Drop leading `/` from glob results to mimick glob@<9 behavior
  .map(filePath => filePath.replace(/^\//, '')).filter(project => !/test|example|sample/i.test(project) || path().dirname(project) === applePlatformDir)).sort((a, b) => {
    const isAInApplePlatformDir = path().dirname(a) === applePlatformDir;
    const isBInApplePlatformDir = path().dirname(b) === applePlatformDir;
    // preserve previous sort order
    if (isAInApplePlatformDir && isBInApplePlatformDir || !isAInApplePlatformDir && !isBInApplePlatformDir) {
      return 0;
    }
    return isAInApplePlatformDir ? -1 : 1;
  });
  if (!pbxprojPaths.length) {
    throw new (_errors().UnexpectedError)(`Failed to locate the ${applePlatformDir}/*.xcodeproj files relative to path "${projectRoot}".`);
  }
  return pbxprojPaths.map(value => path().join(projectRoot, value));
}

/**
 * Get the pbxproj for the given path
 */
function getXcodeProjectPath(projectRoot, applePlatform) {
  const [using, ...extra] = getAllXcodeProjectPaths(projectRoot, applePlatform);
  if (extra.length) {
    warnMultipleFiles({
      applePlatform,
      tag: 'xcodeproj',
      fileName: '*.xcodeproj',
      projectRoot,
      using,
      extra
    });
  }
  return using;
}
function getAllPBXProjectPaths(projectRoot, applePlatform) {
  const applePlatformDir = applePlatform;
  const projectPaths = getAllXcodeProjectPaths(projectRoot, applePlatform);
  const paths = projectPaths.map(value => path().join(value, 'project.pbxproj')).filter(value => (0, _fs().existsSync)(value));
  if (!paths.length) {
    throw new (_errors().UnexpectedError)(`Failed to locate the ${applePlatformDir}/*.xcodeproj/project.pbxproj files relative to path "${projectRoot}".`);
  }
  return paths;
}
function getPBXProjectPath(projectRoot, applePlatform) {
  const [using, ...extra] = getAllPBXProjectPaths(projectRoot, applePlatform);
  if (extra.length) {
    warnMultipleFiles({
      applePlatform,
      tag: 'project-pbxproj',
      fileName: 'project.pbxproj',
      projectRoot,
      using,
      extra
    });
  }
  return using;
}
function getAllInfoPlistPaths(projectRoot, applePlatform) {
  const applePlatformDir = applePlatform;
  const paths = (0, _glob().globSync)(`${applePlatformDir}/*/Info.plist`, {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  }).sort(
  // longer name means more suffixes, we want the shortest possible one to be first.
  (a, b) => a.length - b.length);
  if (!paths.length) {
    throw new (_errors().UnexpectedError)(`Failed to locate Info.plist files relative to path "${projectRoot}".`);
  }
  return paths;
}
function getInfoPlistPath(projectRoot, applePlatform) {
  const [using, ...extra] = getAllInfoPlistPaths(projectRoot, applePlatform);
  if (extra.length) {
    warnMultipleFiles({
      applePlatform,
      tag: 'info-plist',
      fileName: 'Info.plist',
      projectRoot,
      using,
      extra
    });
  }
  return using;
}
function getAllEntitlementsPaths(projectRoot, applePlatform) {
  const applePlatformDir = applePlatform;
  const paths = (0, _glob().globSync)(`${applePlatformDir}/*/*.entitlements`, {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  });
  return paths;
}

/**
 * @deprecated: use Entitlements.getEntitlementsPath instead
 */
function getEntitlementsPath(projectRoot, applePlatform) {
  return Entitlements().getEntitlementsPath(projectRoot, applePlatform);
}
function getSupportingPath(projectRoot, applePlatform) {
  const applePlatformDir = applePlatform;
  return path().resolve(projectRoot, applePlatformDir, path().basename(getSourceRoot(projectRoot, applePlatform)), 'Supporting');
}
function getExpoPlistPath(projectRoot, applePlatform) {
  const supportingPath = getSupportingPath(projectRoot, applePlatform);
  return path().join(supportingPath, 'Expo.plist');
}
function warnMultipleFiles({
  applePlatform,
  tag,
  fileName,
  projectRoot,
  using,
  extra
}) {
  const usingPath = projectRoot ? path().relative(projectRoot, using) : using;
  const extraPaths = projectRoot ? extra.map(v => path().relative(projectRoot, v)) : extra;
  (0, _warnings().addWarningForPlatform)(applePlatform, `paths-${tag}`, `Found multiple ${fileName} file paths, using "${usingPath}". Ignored paths: ${JSON.stringify(extraPaths)}`);
}
//# sourceMappingURL=Paths.js.map