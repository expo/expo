"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferProjectName = exports.configureBuildSettings = exports.configureBuildPhases = exports.createGroup = exports.getGroupByUUID = exports.createFramework = void 0;
const node_fs_1 = require("node:fs");
const utils_1 = require("../utils");
const constants_1 = require("./constants");
const createFramework = (project, targetName, bundleIdentifier) => {
    return project.addTarget(targetName, constants_1.Constants.Target.Framework, targetName, bundleIdentifier);
};
exports.createFramework = createFramework;
const getGroupByUUID = (project, uuid) => {
    return project.getPBXGroupByKey(uuid);
};
exports.getGroupByUUID = getGroupByUUID;
const createGroup = (project, name, path, files = []) => {
    const group = project.addPbxGroup(files, name, path, '"<group>"');
    const mainGroup = (0, exports.getGroupByUUID)(project, project.getFirstProject().firstProject.mainGroup);
    mainGroup.children = [...mainGroup.children, { value: group.uuid, comment: name }];
    return group;
};
exports.createGroup = createGroup;
const configureBuildPhases = (project, target, targetName, projectName, files = []) => {
    const mainTarget = findNativeTargetSection(project, (target) => target.productType === constants_1.Constants.Target.ApplicationProductType);
    const bundlePhase = mainTarget.buildPhases.find((phase) => phase.comment.includes(constants_1.Constants.BuildPhase.RNBundlePhase));
    if (!bundlePhase) {
        throw new Error('`Bundle React Native code and images` build phase cannot be found in main target build phases');
    }
    const destTarget = findNativeTargetSection(project, (target) => target.productType !== constants_1.Constants.Target.ApplicationProductType);
    destTarget.buildPhases = [...destTarget.buildPhases, bundlePhase];
    const script = (0, utils_1.readFromTemplate)('patch-expo.sh', { targetName, projectName });
    project.addBuildPhase([], constants_1.Constants.BuildPhase.Script, constants_1.Constants.BuildPhase.PatchExpoPhase, target.uuid, { shellPath: '/bin/sh', shellScript: script });
    project.addBuildPhase(files, constants_1.Constants.BuildPhase.Sources, target.pbxNativeTarget.name, target.uuid, constants_1.Constants.Target.Framework, constants_1.Constants.Utils.XCEmptyString);
};
exports.configureBuildPhases = configureBuildPhases;
const configureBuildSettings = (project, targetName, currentProjectVersion, bundleIdentifier) => {
    const commonBuildSettings = getCommonBuildSettings(targetName, currentProjectVersion, bundleIdentifier);
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
    const configurationList = project.addXCConfigurationList(buildConfigurationList, 'Release', 'Build configuration list for PBXNativeTarget');
    const nativeTargetSection = project.pbxNativeTargetSection();
    const destTargetKey = Object.keys(nativeTargetSection).find((key) => !key.endsWith('_comment') &&
        nativeTargetSection[key].productType !== constants_1.Constants.Target.ApplicationProductType);
    const destTarget = nativeTargetSection[destTargetKey];
    destTarget.buildConfigurationList = configurationList.uuid;
};
exports.configureBuildSettings = configureBuildSettings;
const getCommonBuildSettings = (targetName, currentProjectVersion, bundleIdentifier) => {
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
const inferProjectName = (platformProjectRoot) => {
    const files = (0, node_fs_1.readdirSync)(platformProjectRoot);
    const xcodeproj = files.find((file) => file.endsWith('.xcodeproj'));
    if (!xcodeproj) {
        throw new Error(`Error: Failed to infer the Xcode project name
      \`config.modRequest.projectName\` is undefined and .xcodeproj cannot be found at \`platformProjectRoot\``);
    }
    return xcodeproj.replace('.xcodeproj', '');
};
exports.inferProjectName = inferProjectName;
const findNativeTargetSection = (project, predicate) => {
    const nativeTargetSection = project.pbxNativeTargetSection();
    const key = Object.keys(nativeTargetSection).find((key) => !key.endsWith('_comment') &&
        typeof nativeTargetSection[key] !== 'string' &&
        predicate(nativeTargetSection[key]));
    if (!key) {
        throw new Error('Native target key mathching predicate cannot be found in native target section of PBXProj');
    }
    return nativeTargetSection[key];
};
