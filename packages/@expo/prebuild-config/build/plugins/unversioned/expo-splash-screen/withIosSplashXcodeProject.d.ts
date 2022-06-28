import { ConfigPlugin } from '@expo/config-plugins';
import { XcodeProject } from 'xcode';
export declare const withIosSplashXcodeProject: ConfigPlugin;
/**
 * Modifies `.pbxproj` by:
 * - adding reference for `.storyboard` file
 */
export declare function setSplashStoryboardAsync({ projectName, project, }: {
    projectName: string;
    project: XcodeProject;
}): Promise<XcodeProject>;
