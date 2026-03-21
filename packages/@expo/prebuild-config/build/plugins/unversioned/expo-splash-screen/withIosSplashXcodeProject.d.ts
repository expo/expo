import { ConfigPlugin, type XcodeProject } from '@expo/config-plugins';
/**
 * @deprecated templates for SDK +55 should use PBXFileSystemSynchronizedRootGroup for the splash screen storyboard.
 */
export declare const withIosSplashXcodeProject: ConfigPlugin;
/**
 * Modifies `.pbxproj` by:
 * - adding reference for `.storyboard` file
 * @deprecated templates for SDK +55 should use PBXFileSystemSynchronizedRootGroup for the splash screen storyboard.
 */
export declare function setSplashStoryboardAsync({ projectName, project, }: {
    projectName: string;
    project: XcodeProject;
}): Promise<XcodeProject>;
