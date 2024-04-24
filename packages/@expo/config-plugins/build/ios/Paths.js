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
function getAppDelegateHeaderFilePath(projectRoot) {
  const [using, ...extra] = (0, _glob().sync)('ios/*/AppDelegate.h', {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  });
  if (!using) {
    throw new (_errors().UnexpectedError)(`Could not locate a valid AppDelegate header at root: "${projectRoot}"`);
  }
  if (extra.length) {
    warnMultipleFiles({
      tag: 'app-delegate-header',
      fileName: 'AppDelegate',
      projectRoot,
      using,
      extra
    });
  }
  return using;
}
function getAppDelegateFilePath(projectRoot) {
  const [using, ...extra] = (0, _glob().sync)('ios/*/AppDelegate.@(m|mm|swift)', {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  });
  if (!using) {
    throw new (_errors().UnexpectedError)(`Could not locate a valid AppDelegate at root: "${projectRoot}"`);
  }
  if (extra.length) {
    warnMultipleFiles({
      tag: 'app-delegate',
      fileName: 'AppDelegate',
      projectRoot,
      using,
      extra
    });
  }
  return using;
}
function getAppDelegateObjcHeaderFilePath(projectRoot) {
  const [using, ...extra] = (0, _glob().sync)('ios/*/AppDelegate.h', {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  });
  if (!using) {
    throw new (_errors().UnexpectedError)(`Could not locate a valid AppDelegate.h at root: "${projectRoot}"`);
  }
  if (extra.length) {
    warnMultipleFiles({
      tag: 'app-delegate-objc-header',
      fileName: 'AppDelegate.h',
      projectRoot,
      using,
      extra
    });
  }
  return using;
}
function getPodfilePath(projectRoot) {
  const [using, ...extra] = (0, _glob().sync)('ios/Podfile', {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  });
  if (!using) {
    throw new (_errors().UnexpectedError)(`Could not locate a valid Podfile at root: "${projectRoot}"`);
  }
  if (extra.length) {
    warnMultipleFiles({
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
      throw new (_errors().UnexpectedError)(`Unexpected iOS file extension: ${extension}`);
  }
}
function getFileInfo(filePath) {
  return {
    path: path().normalize(filePath),
    contents: (0, _fs().readFileSync)(filePath, 'utf8'),
    language: getLanguage(filePath)
  };
}
function getAppDelegate(projectRoot) {
  const filePath = getAppDelegateFilePath(projectRoot);
  return getFileInfo(filePath);
}
function getSourceRoot(projectRoot) {
  const appDelegate = getAppDelegate(projectRoot);
  return path().dirname(appDelegate.path);
}
function findSchemePaths(projectRoot) {
  return (0, _glob().sync)('ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme', {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  });
}
function findSchemeNames(projectRoot) {
  const schemePaths = findSchemePaths(projectRoot);
  return schemePaths.map(schemePath => path().parse(schemePath).name);
}
function getAllXcodeProjectPaths(projectRoot) {
  const iosFolder = 'ios';
  const pbxprojPaths = (0, _glob().sync)('ios/**/*.xcodeproj', {
    cwd: projectRoot,
    ignore: ignoredPaths
  }).filter(project => !/test|example|sample/i.test(project) || path().dirname(project) === iosFolder)
  // sort alphabetically to ensure this works the same across different devices (Fail in CI (linux) without this)
  .sort().sort((a, b) => {
    const isAInIos = path().dirname(a) === iosFolder;
    const isBInIos = path().dirname(b) === iosFolder;
    // preserve previous sort order
    if (isAInIos && isBInIos || !isAInIos && !isBInIos) {
      return 0;
    }
    return isAInIos ? -1 : 1;
  });
  if (!pbxprojPaths.length) {
    throw new (_errors().UnexpectedError)(`Failed to locate the ios/*.xcodeproj files relative to path "${projectRoot}".`);
  }
  return pbxprojPaths.map(value => path().join(projectRoot, value));
}

/**
 * Get the pbxproj for the given path
 */
function getXcodeProjectPath(projectRoot) {
  const [using, ...extra] = getAllXcodeProjectPaths(projectRoot);
  if (extra.length) {
    warnMultipleFiles({
      tag: 'xcodeproj',
      fileName: '*.xcodeproj',
      projectRoot,
      using,
      extra
    });
  }
  return using;
}
function getAllPBXProjectPaths(projectRoot) {
  const projectPaths = getAllXcodeProjectPaths(projectRoot);
  const paths = projectPaths.map(value => path().join(value, 'project.pbxproj')).filter(value => (0, _fs().existsSync)(value));
  if (!paths.length) {
    throw new (_errors().UnexpectedError)(`Failed to locate the ios/*.xcodeproj/project.pbxproj files relative to path "${projectRoot}".`);
  }
  return paths;
}
function getPBXProjectPath(projectRoot) {
  const [using, ...extra] = getAllPBXProjectPaths(projectRoot);
  if (extra.length) {
    warnMultipleFiles({
      tag: 'project-pbxproj',
      fileName: 'project.pbxproj',
      projectRoot,
      using,
      extra
    });
  }
  return using;
}
function getAllInfoPlistPaths(projectRoot) {
  const paths = (0, _glob().sync)('ios/*/Info.plist', {
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
function getInfoPlistPath(projectRoot) {
  const [using, ...extra] = getAllInfoPlistPaths(projectRoot);
  if (extra.length) {
    warnMultipleFiles({
      tag: 'info-plist',
      fileName: 'Info.plist',
      projectRoot,
      using,
      extra
    });
  }
  return using;
}
function getAllEntitlementsPaths(projectRoot) {
  const paths = (0, _glob().sync)('ios/*/*.entitlements', {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths
  });
  return paths;
}

/**
 * @deprecated: use Entitlements.getEntitlementsPath instead
 */
function getEntitlementsPath(projectRoot) {
  return Entitlements().getEntitlementsPath(projectRoot);
}
function getSupportingPath(projectRoot) {
  return path().resolve(projectRoot, 'ios', path().basename(getSourceRoot(projectRoot)), 'Supporting');
}
function getExpoPlistPath(projectRoot) {
  const supportingPath = getSupportingPath(projectRoot);
  return path().join(supportingPath, 'Expo.plist');
}
function warnMultipleFiles({
  tag,
  fileName,
  projectRoot,
  using,
  extra
}) {
  const usingPath = projectRoot ? path().relative(projectRoot, using) : using;
  const extraPaths = projectRoot ? extra.map(v => path().relative(projectRoot, v)) : extra;
  (0, _warnings().addWarningIOS)(`paths-${tag}`, `Found multiple ${fileName} file paths, using "${usingPath}". Ignored paths: ${JSON.stringify(extraPaths)}`);
}
//# sourceMappingURL=Paths.js.map