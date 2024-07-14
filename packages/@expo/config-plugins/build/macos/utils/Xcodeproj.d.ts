/// <reference types="xcode" />
export declare const getProjectName: (projectRoot: string) => string;
export declare const resolvePathOrProject: (projectRootOrProject: string | import("xcode").XcodeProject) => import("xcode").XcodeProject | null;
export declare const getHackyProjectName: (projectRoot: string, config: import("@expo/config-types").ExpoConfig) => string;
/**
 * Add a resource file (ex: `SplashScreen.storyboard`, `Images.xcassets`) to an Xcode project.
 * This is akin to creating a new code file in Xcode with `⌘+n`.
 */
export declare const addResourceFileToGroup: ({ filepath, groupName, isBuildFile, project, verbose, targetUuid, }: {
    filepath: string;
    groupName: string;
    isBuildFile?: boolean | undefined;
    project: import("xcode").XcodeProject;
    verbose?: boolean | undefined;
    targetUuid?: string | undefined;
}) => import("xcode").XcodeProject;
/**
 * Add a build source file (ex: `AppDelegate.m`, `ViewController.swift`) to an Xcode project.
 * This is akin to creating a new code file in Xcode with `⌘+n`.
 */
export declare const addBuildSourceFileToGroup: ({ filepath, groupName, project, verbose, targetUuid, }: {
    filepath: string;
    groupName: string;
    project: import("xcode").XcodeProject;
    verbose?: boolean | undefined;
    targetUuid?: string | undefined;
}) => import("xcode").XcodeProject;
export declare const addFileToGroupAndLink: ({ filepath, groupName, project, verbose, addFileToProject, targetUuid, }: {
    filepath: string;
    groupName: string;
    project: import("xcode").XcodeProject;
    verbose?: boolean | undefined;
    targetUuid?: string | undefined;
    addFileToProject: (props: {
        file: pbxFile;
        project: import("xcode").XcodeProject;
    }) => void;
}) => import("xcode").XcodeProject;
/**
 * Get the pbxproj for the given path
 */
export declare const getPbxproj: (projectRoot: string) => import("xcode").XcodeProject;
export type { ProjectSectionEntry, NativeTargetSection, NativeTargetSectionEntry, ConfigurationLists, ConfigurationListEntry, ConfigurationSectionEntry, } from '../../apple/utils/Xcodeproj';
export { sanitizedName, getApplicationNativeTarget, addFramework, ensureGroupRecursively, getProductName, getProjectSection, getXCConfigurationListEntries, getBuildConfigurationsForListId, getBuildConfigurationForListIdAndName, isBuildConfig, isNotTestHost, isNotComment, unquote, resolveXcodeBuildSetting, } from '../../apple/utils/Xcodeproj';
