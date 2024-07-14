"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getExpoPlistPath = exports.getEntitlementsPath = exports.getAppDelegateObjcHeaderFilePath = exports.getAppDelegateHeaderFilePath = exports.getAppDelegateFilePath = exports.getAppDelegate = exports.getAllXcodeProjectPaths = exports.getAllPBXProjectPaths = exports.getAllInfoPlistPaths = exports.getAllEntitlementsPaths = exports.findSchemePaths = exports.findSchemeNames = void 0;
exports.getFileInfo = getFileInfo;
exports.getXcodeProjectPath = exports.getSupportingPath = exports.getSourceRoot = exports.getPodfilePath = exports.getPBXProjectPath = exports.getInfoPlistPath = void 0;
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
const getAppDelegateHeaderFilePath = applePlatform => projectRoot => {
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
};
exports.getAppDelegateHeaderFilePath = getAppDelegateHeaderFilePath;
const getAppDelegateFilePath = applePlatform => projectRoot => {
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
};
exports.getAppDelegateFilePath = getAppDelegateFilePath;
const getAppDelegateObjcHeaderFilePath = applePlatform => projectRoot => {
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
};
exports.getAppDelegateObjcHeaderFilePath = getAppDelegateObjcHeaderFilePath;
const getPodfilePath = applePlatform => projectRoot => {
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
};
exports.getPodfilePath = getPodfilePath;
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
const getAppDelegate = applePlatform => projectRoot => {
  const filePath = getAppDelegateFilePath(applePlatform)(projectRoot);
  return getFileInfo(filePath);
};
exports.getAppDelegate = getAppDelegate;
const getSourceRoot = applePlatform => projectRoot => {
  const appDelegate = getAppDelegate(applePlatform)(projectRoot);
  return path().dirname(appDelegate.path);
};
exports.getSourceRoot = getSourceRoot;
const findSchemePaths = applePlatform => projectRoot => {
  const applePlatformDir = applePlatform;
  return (0, _glob2().withSortedGlobResult)((0, _glob().globSync)(`${applePlatformDir}/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme`, {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  }));
};
exports.findSchemePaths = findSchemePaths;
const findSchemeNames = applePlatform => projectRoot => {
  const schemePaths = findSchemePaths(applePlatform)(projectRoot);
  return schemePaths.map(schemePath => path().parse(schemePath).name);
};
exports.findSchemeNames = findSchemeNames;
const getAllXcodeProjectPaths = applePlatform => projectRoot => {
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
};

/**
 * Get the pbxproj for the given path
 */
exports.getAllXcodeProjectPaths = getAllXcodeProjectPaths;
const getXcodeProjectPath = applePlatform => projectRoot => {
  const [using, ...extra] = getAllXcodeProjectPaths(applePlatform)(projectRoot);
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
};
exports.getXcodeProjectPath = getXcodeProjectPath;
const getAllPBXProjectPaths = applePlatform => projectRoot => {
  const applePlatformDir = applePlatform;
  const projectPaths = getAllXcodeProjectPaths(applePlatform)(projectRoot);
  const paths = projectPaths.map(value => path().join(value, 'project.pbxproj')).filter(value => (0, _fs().existsSync)(value));
  if (!paths.length) {
    throw new (_errors().UnexpectedError)(`Failed to locate the ${applePlatformDir}/*.xcodeproj/project.pbxproj files relative to path "${projectRoot}".`);
  }
  return paths;
};
exports.getAllPBXProjectPaths = getAllPBXProjectPaths;
const getPBXProjectPath = applePlatform => projectRoot => {
  const [using, ...extra] = getAllPBXProjectPaths(applePlatform)(projectRoot);
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
};
exports.getPBXProjectPath = getPBXProjectPath;
const getAllInfoPlistPaths = applePlatform => projectRoot => {
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
};
exports.getAllInfoPlistPaths = getAllInfoPlistPaths;
const getInfoPlistPath = applePlatform => projectRoot => {
  const [using, ...extra] = getAllInfoPlistPaths(applePlatform)(projectRoot);
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
};
exports.getInfoPlistPath = getInfoPlistPath;
const getAllEntitlementsPaths = applePlatform => projectRoot => {
  const applePlatformDir = applePlatform;
  const paths = (0, _glob().globSync)(`${applePlatformDir}/*/*.entitlements`, {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  });
  return paths;
};

/**
 * @deprecated: use Entitlements.getEntitlementsPath instead
 */
exports.getAllEntitlementsPaths = getAllEntitlementsPaths;
const getEntitlementsPath = applePlatform => projectRoot => {
  return Entitlements().getEntitlementsPath(applePlatform)(projectRoot);
};
exports.getEntitlementsPath = getEntitlementsPath;
const getSupportingPath = applePlatform => projectRoot => {
  const applePlatformDir = applePlatform;
  return path().resolve(projectRoot, applePlatformDir, path().basename(getSourceRoot(applePlatform)(projectRoot)), 'Supporting');
};
exports.getSupportingPath = getSupportingPath;
const getExpoPlistPath = applePlatform => projectRoot => {
  const supportingPath = getSupportingPath(applePlatform)(projectRoot);
  return path().join(supportingPath, 'Expo.plist');
};
exports.getExpoPlistPath = getExpoPlistPath;
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