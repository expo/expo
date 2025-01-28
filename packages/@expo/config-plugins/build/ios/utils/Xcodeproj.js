"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addBuildSourceFileToGroup = addBuildSourceFileToGroup;
exports.addFileToGroupAndLink = addFileToGroupAndLink;
exports.addFramework = addFramework;
exports.addResourceFileToGroup = addResourceFileToGroup;
exports.ensureGroupRecursively = ensureGroupRecursively;
exports.getApplicationNativeTarget = getApplicationNativeTarget;
exports.getBuildConfigurationForListIdAndName = getBuildConfigurationForListIdAndName;
exports.getBuildConfigurationsForListId = getBuildConfigurationsForListId;
exports.getHackyProjectName = getHackyProjectName;
exports.getPbxproj = getPbxproj;
exports.getProductName = getProductName;
exports.getProjectName = getProjectName;
exports.getProjectSection = getProjectSection;
exports.getXCConfigurationListEntries = getXCConfigurationListEntries;
exports.isBuildConfig = isBuildConfig;
exports.isNotComment = isNotComment;
exports.isNotTestHost = isNotTestHost;
exports.resolvePathOrProject = resolvePathOrProject;
exports.resolveXcodeBuildSetting = resolveXcodeBuildSetting;
exports.sanitizedName = sanitizedName;
exports.unquote = unquote;
function _assert() {
  const data = _interopRequireDefault(require("assert"));
  _assert = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _slugify() {
  const data = _interopRequireDefault(require("slugify"));
  _slugify = function () {
    return data;
  };
  return data;
}
function _xcode() {
  const data = _interopRequireDefault(require("xcode"));
  _xcode = function () {
    return data;
  };
  return data;
}
function _pbxFile() {
  const data = _interopRequireDefault(require("xcode/lib/pbxFile"));
  _pbxFile = function () {
    return data;
  };
  return data;
}
function _string() {
  const data = require("./string");
  _string = function () {
    return data;
  };
  return data;
}
function _warnings() {
  const data = require("../../utils/warnings");
  _warnings = function () {
    return data;
  };
  return data;
}
function Paths() {
  const data = _interopRequireWildcard(require("../Paths"));
  Paths = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function getProjectName(projectRoot) {
  const sourceRoot = Paths().getSourceRoot(projectRoot);
  return _path().default.basename(sourceRoot);
}
function resolvePathOrProject(projectRootOrProject) {
  if (typeof projectRootOrProject === 'string') {
    try {
      return getPbxproj(projectRootOrProject);
    } catch {
      return null;
    }
  }
  return projectRootOrProject;
}

// TODO: come up with a better solution for using app.json expo.name in various places
function sanitizedName(name) {
  // Default to the name `app` when every safe character has been sanitized
  return sanitizedNameForProjects(name) || sanitizedNameForProjects((0, _slugify().default)(name)) || 'app';
}
function sanitizedNameForProjects(name) {
  return name.replace(/[\W_]+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// TODO: it's silly and kind of fragile that we look at app config to determine
// the ios project paths. Overall this function needs to be revamped, just a
// placeholder for now! Make this more robust when we support applying config
// at any time (currently it's only applied on eject).
function getHackyProjectName(projectRoot, config) {
  // Attempt to get the current ios folder name (apply).
  try {
    return getProjectName(projectRoot);
  } catch {
    // If no iOS project exists then create a new one (eject).
    const projectName = config.name;
    (0, _assert().default)(projectName, 'Your project needs a name in app.json/app.config.js.');
    return sanitizedName(projectName);
  }
}
function createProjectFileForGroup({
  filepath,
  group
}) {
  const file = new (_pbxFile().default)(filepath);
  const conflictingFile = group.children.find(child => child.comment === file.basename);
  if (conflictingFile) {
    // This can happen when a file like the GoogleService-Info.plist needs to be added and the eject command is run twice.
    // Not much we can do here since it might be a conflicting file.
    return null;
  }
  return file;
}

/**
 * Add a resource file (ex: `SplashScreen.storyboard`, `Images.xcassets`) to an Xcode project.
 * This is akin to creating a new code file in Xcode with `⌘+n`.
 */
function addResourceFileToGroup({
  filepath,
  groupName,
  // Should add to `PBXBuildFile Section`
  isBuildFile,
  project,
  verbose,
  targetUuid
}) {
  return addFileToGroupAndLink({
    filepath,
    groupName,
    project,
    verbose,
    targetUuid,
    addFileToProject({
      project,
      file
    }) {
      project.addToPbxFileReferenceSection(file);
      if (isBuildFile) {
        project.addToPbxBuildFileSection(file);
      }
      project.addToPbxResourcesBuildPhase(file);
    }
  });
}

/**
 * Add a build source file (ex: `AppDelegate.m`, `ViewController.swift`) to an Xcode project.
 * This is akin to creating a new code file in Xcode with `⌘+n`.
 */
function addBuildSourceFileToGroup({
  filepath,
  groupName,
  project,
  verbose,
  targetUuid
}) {
  return addFileToGroupAndLink({
    filepath,
    groupName,
    project,
    verbose,
    targetUuid,
    addFileToProject({
      project,
      file
    }) {
      project.addToPbxFileReferenceSection(file);
      project.addToPbxBuildFileSection(file);
      project.addToPbxSourcesBuildPhase(file);
    }
  });
}

// TODO(brentvatne): I couldn't figure out how to do this with an existing
// higher level function exposed by the xcode library, but we should find out how to do
// that and replace this with it
function addFileToGroupAndLink({
  filepath,
  groupName,
  project,
  verbose,
  addFileToProject,
  targetUuid
}) {
  const group = pbxGroupByPathOrAssert(project, groupName);
  const file = createProjectFileForGroup({
    filepath,
    group
  });
  if (!file) {
    if (verbose) {
      // This can happen when a file like the GoogleService-Info.plist needs to be added and the eject command is run twice.
      // Not much we can do here since it might be a conflicting file.
      (0, _warnings().addWarningIOS)('ios-xcode-project', `Skipped adding duplicate file "${filepath}" to PBXGroup named "${groupName}"`);
    }
    return project;
  }
  if (targetUuid != null) {
    file.target = targetUuid;
  } else {
    const applicationNativeTarget = project.getTarget('com.apple.product-type.application');
    file.target = applicationNativeTarget?.uuid;
  }
  file.uuid = project.generateUuid();
  file.fileRef = project.generateUuid();
  addFileToProject({
    project,
    file
  });
  group.children.push({
    value: file.fileRef,
    comment: file.basename
  });
  return project;
}
function getApplicationNativeTarget({
  project,
  projectName
}) {
  const applicationNativeTarget = project.getTarget('com.apple.product-type.application');
  (0, _assert().default)(applicationNativeTarget, `Couldn't locate application PBXNativeTarget in '.xcodeproj' file.`);
  (0, _assert().default)(String(applicationNativeTarget.target.name) === projectName, `Application native target name mismatch. Expected ${projectName}, but found ${applicationNativeTarget.target.name}.`);
  return applicationNativeTarget;
}

/**
 * Add a framework to the default app native target.
 *
 * @param projectName Name of the PBX project.
 * @param framework String ending in `.framework`, i.e. `StoreKit.framework`
 */
function addFramework({
  project,
  projectName,
  framework
}) {
  const target = getApplicationNativeTarget({
    project,
    projectName
  });
  return project.addFramework(framework, {
    target: target.uuid
  });
}
function splitPath(path) {
  // TODO: Should we account for other platforms that may not use `/`
  return path.split('/');
}
const findGroup = (group, name) => {
  if (!group) {
    return undefined;
  }
  return group.children.find(group => group.comment === name);
};
function findGroupInsideGroup(project, group, name) {
  const foundGroup = findGroup(group, name);
  if (foundGroup) {
    return project.getPBXGroupByKey(foundGroup.value) ?? null;
  }
  return null;
}
function pbxGroupByPathOrAssert(project, path) {
  const {
    firstProject
  } = project.getFirstProject();
  let group = project.getPBXGroupByKey(firstProject.mainGroup);
  const components = splitPath(path);
  for (const name of components) {
    const nextGroup = findGroupInsideGroup(project, group, name);
    if (nextGroup) {
      group = nextGroup;
    } else {
      break;
    }
  }
  if (!group) {
    throw Error(`Xcode PBXGroup with name "${path}" could not be found in the Xcode project.`);
  }
  return group;
}
function ensureGroupRecursively(project, filepath) {
  const components = splitPath(filepath);
  const hasChild = (group, name) => group.children.find(({
    comment
  }) => comment === name);
  const {
    firstProject
  } = project.getFirstProject();
  let topMostGroup = project.getPBXGroupByKey(firstProject.mainGroup);
  for (const pathComponent of components) {
    if (topMostGroup && !hasChild(topMostGroup, pathComponent)) {
      topMostGroup.children.push({
        comment: pathComponent,
        value: project.pbxCreateGroup(pathComponent, '""')
      });
    }
    topMostGroup = project.pbxGroupByName(pathComponent);
  }
  return topMostGroup ?? null;
}

/**
 * Get the pbxproj for the given path
 */
function getPbxproj(projectRoot) {
  const projectPath = Paths().getPBXProjectPath(projectRoot);
  const project = _xcode().default.project(projectPath);
  project.parseSync();
  return project;
}

/**
 * Get the productName for a project, if the name is using a variable `$(TARGET_NAME)`, then attempt to get the value of that variable.
 *
 * @param project
 */
function getProductName(project) {
  let productName = '$(TARGET_NAME)';
  try {
    // If the product name is numeric, this will fail (it's a getter).
    // If the bundle identifier' final component is only numeric values, then the PRODUCT_NAME
    // will be a numeric value, this results in a bug where the product name isn't useful,
    // i.e. `com.bacon.001` -> `1` -- in this case, use the first target name.
    productName = project.productName;
  } catch {}
  if (productName === '$(TARGET_NAME)') {
    const targetName = project.getFirstTarget()?.firstTarget?.productName;
    productName = targetName ?? productName;
  }
  return productName;
}
function getProjectSection(project) {
  return project.pbxProjectSection();
}
function getXCConfigurationListEntries(project) {
  const lists = project.pbxXCConfigurationList();
  return Object.entries(lists).filter(isNotComment);
}
function getBuildConfigurationsForListId(project, configurationListId) {
  const configurationListEntries = getXCConfigurationListEntries(project);
  const [, configurationList] = configurationListEntries.find(([key]) => key === configurationListId);
  const buildConfigurations = configurationList.buildConfigurations.map(i => i.value);
  return Object.entries(project.pbxXCBuildConfigurationSection()).filter(isNotComment).filter(isBuildConfig).filter(([key]) => buildConfigurations.includes(key));
}
function getBuildConfigurationForListIdAndName(project, {
  configurationListId,
  buildConfiguration
}) {
  const xcBuildConfigurationEntry = getBuildConfigurationsForListId(project, configurationListId).find(i => (0, _string().trimQuotes)(i[1].name) === buildConfiguration);
  if (!xcBuildConfigurationEntry) {
    throw new Error(`Build configuration '${buildConfiguration}' does not exist in list with id '${configurationListId}'`);
  }
  return xcBuildConfigurationEntry;
}
function isBuildConfig([, sectionItem]) {
  return sectionItem.isa === 'XCBuildConfiguration';
}
function isNotTestHost([, sectionItem]) {
  return !sectionItem.buildSettings.TEST_HOST;
}
function isNotComment([key]) {
  return !key.endsWith(`_comment`);
}

// Remove surrounding double quotes if they exist.
function unquote(value) {
  // projects with numeric names will fail due to a bug in the xcode package.
  if (typeof value === 'number') {
    value = String(value);
  }
  return value.match(/^"(.*)"$/)?.[1] ?? value;
}
function resolveXcodeBuildSetting(value, lookup) {
  const parsedValue = value?.replace(/\$\(([^()]*|\([^)]*\))\)/g, match => {
    // Remove the `$(` and `)`, then split modifier(s) from the variable name.
    const [variable, ...transformations] = match.slice(2, -1).split(':');
    // Resolve the variable recursively.
    let lookedUp = lookup(variable);
    if (lookedUp) {
      lookedUp = resolveXcodeBuildSetting(lookedUp, lookup);
    }
    let resolved = lookedUp;

    // Ref: http://codeworkshop.net/posts/xcode-build-setting-transformations
    transformations.forEach(modifier => {
      switch (modifier) {
        case 'lower':
          // A lowercase representation.
          resolved = resolved?.toLowerCase();
          break;
        case 'upper':
          // An uppercase representation.
          resolved = resolved?.toUpperCase();
          break;
        case 'suffix':
          if (resolved) {
            // The extension of a path including the '.' divider.
            resolved = _path().default.extname(resolved);
          }
          break;
        case 'file':
          if (resolved) {
            // The file portion of a path.
            resolved = _path().default.basename(resolved);
          }
          break;
        case 'dir':
          if (resolved) {
            // The directory portion of a path.
            resolved = _path().default.dirname(resolved);
          }
          break;
        case 'base':
          if (resolved) {
            // The base name of a path - the last path component with any extension removed.
            const b = _path().default.basename(resolved);
            const extensionIndex = b.lastIndexOf('.');
            resolved = extensionIndex === -1 ? b : b.slice(0, extensionIndex);
          }
          break;
        case 'rfc1034identifier':
          // A representation suitable for use in a DNS name.

          // TODO: Check the spec if there is one, this is just what we had before.
          resolved = resolved?.replace(/[^a-zA-Z0-9]/g, '-');
          // resolved = resolved.replace(/[\/\*\s]/g, '-');
          break;
        case 'c99extidentifier':
          // Like identifier, but with support for extended characters allowed by C99. Added in Xcode 6.
          // TODO: Check the spec if there is one.
          resolved = resolved?.replace(/[-\s]/g, '_');
          break;
        case 'standardizepath':
          if (resolved) {
            // The equivalent of calling stringByStandardizingPath on the string.
            // https://developer.apple.com/documentation/foundation/nsstring/1407194-standardizingpath
            resolved = _path().default.resolve(resolved);
          }
          break;
        default:
          resolved ||= modifier.match(/default=(.*)/)?.[1];
          break;
      }
    });
    return resolveXcodeBuildSetting(resolved ?? '', lookup);
  });
  if (parsedValue !== value) {
    return resolveXcodeBuildSetting(parsedValue, lookup);
  }
  return value;
}
//# sourceMappingURL=Xcodeproj.js.map