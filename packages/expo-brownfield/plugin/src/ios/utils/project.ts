import { readdirSync } from 'node:fs';

import type { XcodeProject } from 'expo/config-plugins';

import type { Group, PbxGroup, Target } from '../types';
import { readFromTemplate } from '../utils';
import { Constants } from './constants';

export const createFramework = (
  project: XcodeProject,
  targetName: string,
  bundleIdentifier: string,
): Target => {
  return project.addTarget(
    targetName,
    Constants.Target.Framework,
    targetName,
    bundleIdentifier,
  ) as unknown as Target;
};

export const getGroupByUUID = (
  project: XcodeProject,
  uuid: string,
): PbxGroup => {
  return project.getPBXGroupByKey(uuid) as unknown as PbxGroup;
};

export const createGroup = (
  project: XcodeProject,
  name: string,
  path: string,
  files: string[] = [],
): Group => {
  const group = project.addPbxGroup(
    files,
    name,
    path,
    '"<group>"',
  ) as unknown as Group;

  const mainGroup = getGroupByUUID(
    project,
    project.getFirstProject().firstProject.mainGroup,
  );

  mainGroup.children = [
    ...mainGroup.children,
    { value: group.uuid, comment: name },
  ];

  return group;
};

export const configureBuildPhases = (
  project: XcodeProject,
  target: Target,
  targetName: string,
  projectName: string,
  files: string[] = [],
) => {
  const nativeTargetSection = project.pbxNativeTargetSection();

  const mainTargetKey = Object.keys(nativeTargetSection).find(
    (key) =>
      !key.endsWith('_comment') &&
      nativeTargetSection[key].productType ===
        Constants.Target.ApplicationProductType,
  );
  const mainTarget = nativeTargetSection[mainTargetKey];

  // TODO: Fix types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bundlePhase = mainTarget.buildPhases.find((phase: any) =>
    phase.comment.includes(Constants.BuildPhase.RNBundlePhase),
  );

  const destTargetKey = Object.keys(nativeTargetSection).find(
    (key) =>
      !key.endsWith('_comment') &&
      nativeTargetSection[key].productType !==
        Constants.Target.ApplicationProductType,
  );
  const destTarget = nativeTargetSection[destTargetKey];

  destTarget.buildPhases = [...destTarget.buildPhases, bundlePhase];

  const script = readFromTemplate('patch-expo.sh', { targetName, projectName });
  project.addBuildPhase(
    [],
    Constants.BuildPhase.Script,
    Constants.BuildPhase.PatchExpoPhase,
    target.uuid,
    { shellPath: '/bin/sh', shellScript: script },
  );

  project.addBuildPhase(
    files,
    Constants.BuildPhase.Sources,
    target.pbxNativeTarget.name,
    target.uuid,
    Constants.Target.Framework,
    Constants.Utils.XCEmptyString,
  );
};

export const configureBuildSettings = (
  project: XcodeProject,
  targetName: string,
  currentProjectVersion: string,
  bundleIdentifier: string,
) => {
  const commonBuildSettings = getCommonBuildSettings(
    targetName,
    currentProjectVersion,
    bundleIdentifier,
  );

  const buildConfigurationList = [
    {
      name: 'Debug',
      isa: 'XCBuildConfiguration',
      buildSettings: {
        ...commonBuildSettings,
      },
    },
    {
      name: 'Release',
      isa: 'XCBuildConfiguration',
      buildSettings: {
        ...commonBuildSettings,
      },
    },
  ];

  const configurationList = project.addXCConfigurationList(
    buildConfigurationList,
    'Release',
    'Build configuration list for PBXNativeTarget',
  );

  const nativeTargetSection = project.pbxNativeTargetSection();

  const destTargetKey = Object.keys(nativeTargetSection).find(
    (key) =>
      !key.endsWith('_comment') &&
      nativeTargetSection[key].productType !==
        Constants.Target.ApplicationProductType,
  );
  const destTarget = nativeTargetSection[destTargetKey];

  destTarget.buildConfigurationList = configurationList.uuid;
};

const getCommonBuildSettings = (
  targetName: string,
  currentProjectVersion: string,
  bundleIdentifier: string,
): Record<string, string> => {
  return {
    /* ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
    ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME = WidgetBackground;
    CLANG_ANALYZER_NONNULL = YES;
    CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
    CLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
    CLANG_ENABLE_OBJC_WEAK = YES;
    CLANG_WARN_DOCUMENTATION_COMMENTS = YES;
    CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = YES;
    CLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE;
    CODE_SIGN_STYLE = Automatic;
    DEBUG_INFORMATION_FORMAT = dwarf;
    DEVELOPMENT_TEAM = ;
    GCC_C_LANGUAGE_STANDARD = gnu11;
    LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks";
    MARKETING_VERSION = 1.0;
    MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
    MTL_FAST_MATH = YES;
    SKIP_INSTALL = YES;
    SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;
    SWIFT_EMIT_LOC_STRINGS = YES;
    SWIFT_OPTIMIZATION_LEVEL = "-Onone"; */
    PRODUCT_NAME: `"$(TARGET_NAME)"`,
    SWIFT_VERSION: '5.0',
    TARGETED_DEVICE_FAMILY: `"1,2"`,
    INFOPLIST_FILE: `${targetName}/Info.plist`,
    CURRENT_PROJECT_VERSION: `"${currentProjectVersion}"`,
    // IPHONEOS_DEPLOYMENT_TARGET: `"${deploymentTarget}"`,
    PRODUCT_BUNDLE_IDENTIFIER: `"${bundleIdentifier}"`,
    GENERATE_INFOPLIST_FILE: `"YES"`,
    INFOPLIST_KEY_CFBundleDisplayName: targetName,
    INFOPLIST_KEY_NSHumanReadableCopyright: `""`,
    // MARKETING_VERSION: `"${marketingVersion}"`,
    SWIFT_OPTIMIZATION_LEVEL: `"-Onone"`,
    CODE_SIGN_ENTITLEMENTS: `"${targetName}/${targetName}.entitlements"`,
    // DEVELOPMENT_TEAM: `""`,
    BUILD_LIBRARY_FOR_DISTRIBUTION: '"YES"',
    USER_SCRIPT_SANDBOXING: '"NO"',
    SKIP_INSTALL: '"NO"',
    ENABLE_MODULE_VERIFIER: '"NO"',
  };
};

export const inferProjectName = (platformProjectRoot: string): string => {
  const files = readdirSync(platformProjectRoot);
  const xcodeproj = files.find((file) => file.endsWith('.xcodeproj'));

  if (!xcodeproj) {
    throw new Error(
      `Error: Failed to infer the Xcode project name
      \`config.modRequest.projectName\` is undefined and .xcodeproj cannot be found at \`platformProjectRoot\``,
    );
  }

  return xcodeproj.replace('.xcodeproj', '');
};
