import { ConfigPlugin, IOSConfig, withXcodeProject } from '@expo/config-plugins';
import path from 'path';
import { XcodeProject } from 'xcode';

import { STORYBOARD_FILE_PATH } from './withIosSplashScreenStoryboard';

const debug = require('debug')(
  'expo:prebuild-config:expo-splash-screen:ios:xcodeproj'
) as typeof console.log;

export const withIosSplashXcodeProject: ConfigPlugin = config => {
  return withXcodeProject(config, async config => {
    config.modResults = await setSplashStoryboardAsync({
      projectName: config.modRequest.projectName!,
      project: config.modResults,
    });
    return config;
  });
};

/**
 * Modifies `.pbxproj` by:
 * - adding reference for `.storyboard` file
 */
export async function setSplashStoryboardAsync({
  projectName,
  project,
}: {
  projectName: string;
  project: XcodeProject;
}): Promise<XcodeProject> {
  // Check if `${projectName}/SplashScreen.storyboard` already exists
  // Path relative to `ios` directory
  const storyboardFilePath = path.join(projectName, STORYBOARD_FILE_PATH);
  if (!project.hasFile(storyboardFilePath)) {
    debug(`Adding ${storyboardFilePath} to Xcode project`);
    IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: storyboardFilePath,
      groupName: projectName,
      project,
    });
  }

  return project;
}
