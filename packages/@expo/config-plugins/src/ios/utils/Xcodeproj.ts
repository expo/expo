/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExpoConfig } from '@expo/config-types';
import assert from 'assert';
import path from 'path';
import slugify from 'slugify';
import xcode, {
  PBXFile,
  PBXGroup,
  PBXNativeTarget,
  PBXProject,
  UUID,
  XCBuildConfiguration,
  XCConfigurationList,
  XcodeProject,
} from 'xcode';
import pbxFile from 'xcode/lib/pbxFile';

import { trimQuotes } from './string';
import { addWarningIOS } from '../../utils/warnings';
import * as Paths from '../Paths';

export type ProjectSectionEntry = [string, PBXProject];

export type NativeTargetSection = Record<string, PBXNativeTarget>;

export type NativeTargetSectionEntry = [string, PBXNativeTarget];

export type ConfigurationLists = Record<string, XCConfigurationList>;

export type ConfigurationListEntry = [string, XCConfigurationList];

export type ConfigurationSectionEntry = [string, XCBuildConfiguration];

export function getProjectName(projectRoot: string) {
  const sourceRoot = Paths.getSourceRoot(projectRoot);
  return path.basename(sourceRoot);
}

export function resolvePathOrProject(
  projectRootOrProject: string | XcodeProject
): XcodeProject | null {
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
export function sanitizedName(name: string) {
  // Default to the name `app` when every safe character has been sanitized
  return sanitizedNameForProjects(name) || sanitizedNameForProjects(slugify(name)) || 'app';
}

function sanitizedNameForProjects(name: string) {
  return name
    .replace(/[\W_]+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// TODO: it's silly and kind of fragile that we look at app config to determine
// the ios project paths. Overall this function needs to be revamped, just a
// placeholder for now! Make this more robust when we support applying config
// at any time (currently it's only applied on eject).
export function getHackyProjectName(projectRoot: string, config: ExpoConfig): string {
  // Attempt to get the current ios folder name (apply).
  try {
    return getProjectName(projectRoot);
  } catch {
    // If no iOS project exists then create a new one (eject).
    const projectName = config.name;
    assert(projectName, 'Your project needs a name in app.json/app.config.js.');
    return sanitizedName(projectName);
  }
}

function createProjectFileForGroup({ filepath, group }: { filepath: string; group: PBXGroup }) {
  const file = new pbxFile(filepath);

  const conflictingFile = group.children.find((child) => child.comment === file.basename);
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
export function addResourceFileToGroup({
  filepath,
  groupName,
  // Should add to `PBXBuildFile Section`
  isBuildFile,
  project,
  verbose,
  targetUuid,
}: {
  filepath: string;
  groupName: string;
  isBuildFile?: boolean;
  project: XcodeProject;
  verbose?: boolean;
  targetUuid?: string;
}): XcodeProject {
  return addFileToGroupAndLink({
    filepath,
    groupName,
    project,
    verbose,
    targetUuid,
    addFileToProject({ project, file }) {
      project.addToPbxFileReferenceSection(file);
      if (isBuildFile) {
        project.addToPbxBuildFileSection(file);
      }
      project.addToPbxResourcesBuildPhase(file);
    },
  });
}

/**
 * Add a build source file (ex: `AppDelegate.m`, `ViewController.swift`) to an Xcode project.
 * This is akin to creating a new code file in Xcode with `⌘+n`.
 */
export function addBuildSourceFileToGroup({
  filepath,
  groupName,
  project,
  verbose,
  targetUuid,
}: {
  filepath: string;
  groupName: string;
  project: XcodeProject;
  verbose?: boolean;
  targetUuid?: string;
}): XcodeProject {
  return addFileToGroupAndLink({
    filepath,
    groupName,
    project,
    verbose,
    targetUuid,
    addFileToProject({ project, file }) {
      project.addToPbxFileReferenceSection(file);
      project.addToPbxBuildFileSection(file);
      project.addToPbxSourcesBuildPhase(file);
    },
  });
}

// TODO(brentvatne): I couldn't figure out how to do this with an existing
// higher level function exposed by the xcode library, but we should find out how to do
// that and replace this with it
export function addFileToGroupAndLink({
  filepath,
  groupName,
  project,
  verbose,
  addFileToProject,
  targetUuid,
}: {
  filepath: string;
  groupName: string;
  project: XcodeProject;
  verbose?: boolean;
  targetUuid?: string;
  addFileToProject: (props: { file: PBXFile; project: XcodeProject }) => void;
}): XcodeProject {
  const group = pbxGroupByPathOrAssert(project, groupName);

  const file = createProjectFileForGroup({ filepath, group });

  if (!file) {
    if (verbose) {
      // This can happen when a file like the GoogleService-Info.plist needs to be added and the eject command is run twice.
      // Not much we can do here since it might be a conflicting file.
      addWarningIOS(
        'ios-xcode-project',
        `Skipped adding duplicate file "${filepath}" to PBXGroup named "${groupName}"`
      );
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

  addFileToProject({ project, file });

  group.children.push({
    value: file.fileRef,
    comment: file.basename,
  });
  return project;
}

export function getApplicationNativeTarget({
  project,
  projectName,
}: {
  project: XcodeProject;
  projectName: string;
}) {
  const applicationNativeTarget = project.getTarget('com.apple.product-type.application');
  assert(
    applicationNativeTarget,
    `Couldn't locate application PBXNativeTarget in '.xcodeproj' file.`
  );
  assert(
    String(applicationNativeTarget.target.name) === projectName,
    `Application native target name mismatch. Expected ${projectName}, but found ${applicationNativeTarget.target.name}.`
  );
  return applicationNativeTarget;
}

/**
 * Add a framework to the default app native target.
 *
 * @param projectName Name of the PBX project.
 * @param framework String ending in `.framework`, i.e. `StoreKit.framework`
 */
export function addFramework({
  project,
  projectName,
  framework,
}: {
  project: XcodeProject;
  projectName: string;
  framework: string;
}) {
  const target = getApplicationNativeTarget({ project, projectName });
  return project.addFramework(framework, { target: target.uuid });
}

function splitPath(path: string): string[] {
  // TODO: Should we account for other platforms that may not use `/`
  return path.split('/');
}

const findGroup = (
  group: PBXGroup | undefined,
  name: string
):
  | {
      value: UUID;
      comment?: string;
    }
  | undefined => {
  if (!group) {
    return undefined;
  }

  return group.children.find((group) => group.comment === name);
};

function findGroupInsideGroup(
  project: XcodeProject,
  group: PBXGroup | undefined,
  name: string
): null | PBXGroup {
  const foundGroup = findGroup(group, name);
  if (foundGroup) {
    return project.getPBXGroupByKey(foundGroup.value) ?? null;
  }
  return null;
}

function pbxGroupByPathOrAssert(project: XcodeProject, path: string): PBXGroup {
  const { firstProject } = project.getFirstProject();

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

export function ensureGroupRecursively(project: XcodeProject, filepath: string): PBXGroup | null {
  const components = splitPath(filepath);
  const hasChild = (group: PBXGroup, name: string) =>
    group.children.find(({ comment }) => comment === name);
  const { firstProject } = project.getFirstProject();

  let topMostGroup = project.getPBXGroupByKey(firstProject.mainGroup);

  for (const pathComponent of components) {
    if (topMostGroup && !hasChild(topMostGroup, pathComponent)) {
      topMostGroup.children.push({
        comment: pathComponent,
        value: project.pbxCreateGroup(pathComponent, '""'),
      });
    }
    topMostGroup = project.pbxGroupByName(pathComponent);
  }
  return topMostGroup ?? null;
}

/**
 * Get the pbxproj for the given path
 */
export function getPbxproj(projectRoot: string): XcodeProject {
  const projectPath = Paths.getPBXProjectPath(projectRoot);
  const project = xcode.project(projectPath);
  project.parseSync();
  return project;
}

/**
 * Get the productName for a project, if the name is using a variable `$(TARGET_NAME)`, then attempt to get the value of that variable.
 *
 * @param project
 */
export function getProductName(project: XcodeProject): string {
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

export function getProjectSection(project: XcodeProject) {
  return project.pbxProjectSection();
}

export function getXCConfigurationListEntries(project: XcodeProject): ConfigurationListEntry[] {
  const lists = project.pbxXCConfigurationList();
  return Object.entries(lists).filter(isNotComment);
}

export function getBuildConfigurationsForListId(
  project: XcodeProject,
  configurationListId: string
): ConfigurationSectionEntry[] {
  const configurationListEntries = getXCConfigurationListEntries(project);
  const [, configurationList] = configurationListEntries.find(
    ([key]) => key === configurationListId
  ) as ConfigurationListEntry;

  const buildConfigurations = configurationList.buildConfigurations.map((i) => i.value);

  return Object.entries(project.pbxXCBuildConfigurationSection())
    .filter(isNotComment)
    .filter(isBuildConfig)
    .filter(([key]: ConfigurationSectionEntry) => buildConfigurations.includes(key));
}

export function getBuildConfigurationForListIdAndName(
  project: XcodeProject,
  {
    configurationListId,
    buildConfiguration,
  }: { configurationListId: string; buildConfiguration: string }
): ConfigurationSectionEntry {
  const xcBuildConfigurationEntry = getBuildConfigurationsForListId(
    project,
    configurationListId
  ).find((i) => trimQuotes(i[1].name) === buildConfiguration);
  if (!xcBuildConfigurationEntry) {
    throw new Error(
      `Build configuration '${buildConfiguration}' does not exist in list with id '${configurationListId}'`
    );
  }
  return xcBuildConfigurationEntry;
}

export function isBuildConfig([, sectionItem]: ConfigurationSectionEntry): boolean {
  return sectionItem.isa === 'XCBuildConfiguration';
}

export function isNotTestHost([, sectionItem]: ConfigurationSectionEntry): boolean {
  return !sectionItem.buildSettings.TEST_HOST;
}

export function isNotComment([key]:
  | ConfigurationSectionEntry
  | ProjectSectionEntry
  | ConfigurationListEntry
  | NativeTargetSectionEntry): boolean {
  return !key.endsWith(`_comment`);
}

// Remove surrounding double quotes if they exist.
export function unquote(value: string): string {
  // projects with numeric names will fail due to a bug in the xcode package.
  if (typeof value === 'number') {
    value = String(value);
  }
  return value.match(/^"(.*)"$/)?.[1] ?? value;
}

export function resolveXcodeBuildSetting(
  value: string,
  lookup: (buildSetting: string) => string | undefined
): string {
  const parsedValue = value?.replace(/\$\(([^()]*|\([^)]*\))\)/g, (match) => {
    // Remove the `$(` and `)`, then split modifier(s) from the variable name.
    const [variable, ...transformations] = match.slice(2, -1).split(':');
    // Resolve the variable recursively.
    let lookedUp = lookup(variable);
    if (lookedUp) {
      lookedUp = resolveXcodeBuildSetting(lookedUp, lookup);
    }
    let resolved = lookedUp;

    // Ref: http://codeworkshop.net/posts/xcode-build-setting-transformations
    transformations.forEach((modifier) => {
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
            resolved = path.extname(resolved);
          }
          break;
        case 'file':
          if (resolved) {
            // The file portion of a path.
            resolved = path.basename(resolved);
          }
          break;
        case 'dir':
          if (resolved) {
            // The directory portion of a path.
            resolved = path.dirname(resolved);
          }
          break;
        case 'base':
          if (resolved) {
            // The base name of a path - the last path component with any extension removed.
            const b = path.basename(resolved);
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
            resolved = path.resolve(resolved);
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
