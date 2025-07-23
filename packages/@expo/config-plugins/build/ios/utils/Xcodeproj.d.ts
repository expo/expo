/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ExpoConfig } from '@expo/config-types';
import xcode, { PBXFile, PBXGroup, PBXNativeTarget, PBXProject, UUID, XCBuildConfiguration, XCConfigurationList, XcodeProject } from 'xcode';
export type ProjectSectionEntry = [string, PBXProject];
export type NativeTargetSection = Record<string, PBXNativeTarget>;
export type NativeTargetSectionEntry = [string, PBXNativeTarget];
export type ConfigurationLists = Record<string, XCConfigurationList>;
export type ConfigurationListEntry = [string, XCConfigurationList];
export type ConfigurationSectionEntry = [string, XCBuildConfiguration];
export declare function getProjectName(projectRoot: string): string;
export declare function resolvePathOrProject(projectRootOrProject: string | XcodeProject): XcodeProject | null;
export declare function sanitizedName(name: string): string;
export declare function getHackyProjectName(projectRoot: string, config: ExpoConfig): string;
/**
 * Add a resource file (ex: `SplashScreen.storyboard`, `Images.xcassets`) to an Xcode project.
 * This is akin to creating a new code file in Xcode with `⌘+n`.
 */
export declare function addResourceFileToGroup({ filepath, groupName, isBuildFile, project, verbose, targetUuid, }: {
    filepath: string;
    groupName: string;
    isBuildFile?: boolean;
    project: XcodeProject;
    verbose?: boolean;
    targetUuid?: string;
}): XcodeProject;
/**
 * Add a build source file (ex: `AppDelegate.m`, `ViewController.swift`) to an Xcode project.
 * This is akin to creating a new code file in Xcode with `⌘+n`.
 */
export declare function addBuildSourceFileToGroup({ filepath, groupName, project, verbose, targetUuid, }: {
    filepath: string;
    groupName: string;
    project: XcodeProject;
    verbose?: boolean;
    targetUuid?: string;
}): XcodeProject;
export declare function addFileToGroupAndLink({ filepath, groupName, project, verbose, addFileToProject, targetUuid, }: {
    filepath: string;
    groupName: string;
    project: XcodeProject;
    verbose?: boolean;
    targetUuid?: string;
    addFileToProject: (props: {
        file: PBXFile;
        project: XcodeProject;
    }) => void;
}): XcodeProject;
export declare function getApplicationNativeTarget({ project, projectName, }: {
    project: XcodeProject;
    projectName: string;
}): {
    uuid: UUID;
    target: PBXNativeTarget;
};
/**
 * Add a framework to the default app native target.
 *
 * @param projectName Name of the PBX project.
 * @param framework String ending in `.framework`, i.e. `StoreKit.framework`
 */
export declare function addFramework({ project, projectName, framework, }: {
    project: XcodeProject;
    projectName: string;
    framework: string;
}): unknown;
export declare function ensureGroupRecursively(project: XcodeProject, filepath: string): PBXGroup | null;
/**
 * Get the pbxproj for the given path
 */
export declare function getPbxproj(projectRoot: string): XcodeProject;
/**
 * Get the productName for a project, if the name is using a variable `$(TARGET_NAME)`, then attempt to get the value of that variable.
 *
 * @param project
 */
export declare function getProductName(project: XcodeProject): string;
export declare function getProjectSection(project: XcodeProject): Record<string, xcode.PBXProject> & Record<string, string>;
export declare function getXCConfigurationListEntries(project: XcodeProject): ConfigurationListEntry[];
export declare function getBuildConfigurationsForListId(project: XcodeProject, configurationListId: string): ConfigurationSectionEntry[];
export declare function getBuildConfigurationForListIdAndName(project: XcodeProject, { configurationListId, buildConfiguration, }: {
    configurationListId: string;
    buildConfiguration: string;
}): ConfigurationSectionEntry;
export declare function isBuildConfig([, sectionItem]: ConfigurationSectionEntry): boolean;
export declare function isNotTestHost([, sectionItem]: ConfigurationSectionEntry): boolean;
export declare function isNotComment([key]: ConfigurationSectionEntry | ProjectSectionEntry | ConfigurationListEntry | NativeTargetSectionEntry): boolean;
export declare function unquote(value: string): string;
export declare function resolveXcodeBuildSetting(value: string, lookup: (buildSetting: string) => string | undefined): string;
