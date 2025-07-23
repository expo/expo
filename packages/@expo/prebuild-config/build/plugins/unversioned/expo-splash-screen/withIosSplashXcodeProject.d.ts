import { ConfigPlugin, type XcodeProject } from '@expo/config-plugins';
export declare const withIosSplashXcodeProject: ConfigPlugin;
/**
 * Modifies `.pbxproj` by:
 * - adding reference for `.storyboard` file
 */
export declare function setSplashStoryboardAsync({ projectName, project, }: {
    projectName: string;
    project: XcodeProject;
}): Promise<XcodeProject>;
