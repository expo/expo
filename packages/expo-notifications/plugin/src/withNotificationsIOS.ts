import {
  ConfigPlugin,
  withEntitlementsPlist,
  IOSConfig,
  withXcodeProject,
} from '@expo/config-plugins';
import { copyFileSync } from 'fs';
import { basename, resolve } from 'path';

import { NotificationsPluginProps } from './withNotifications';

type XcodeProject = any;

export const withNotificationsIOS: ConfigPlugin<NotificationsPluginProps> = (
  config,
  { mode = 'development', sounds = [] }
) => {
  config = withEntitlementsPlist(config, config => {
    config.modResults['aps-environment'] = mode;
    return config;
  });
  config = withNotificationSounds(config, { sounds });
  return config;
};

export const withNotificationSounds: ConfigPlugin<{ sounds: string[] }> = (config, { sounds }) => {
  return withXcodeProject(config, config => {
    setNotificationSounds(sounds, {
      projectRoot: config.modRequest.projectRoot,
      project: config.modResults,
    });
    return config;
  });
};

/**
 * Save sound files to the Xcode project root and add them to the Xcode project.
 */
export function setNotificationSounds(
  sounds: string[],
  { projectRoot, project }: { project: XcodeProject; projectRoot: string }
): XcodeProject {
  if (!Array.isArray(sounds)) {
    throw new Error(
      `Must provide an array of sound files in your app config, found ${typeof sounds}.`
    );
  }

  const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);

  sounds.map((soundFileRelativePath: string) => {
    const fileName = basename(soundFileRelativePath);
    const sourceFilepath = resolve(projectRoot, soundFileRelativePath);
    const destinationFilepath = resolve(IOSConfig.Paths.getSourceRoot(projectRoot), fileName);

    copyFileSync(sourceFilepath, destinationFilepath);
    if (!project.hasFile(`${projectName}/${fileName}`)) {
      project = IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: `${projectName}/${fileName}`,
        groupName: projectName,
        project: project,
        isBuildFile: true,
      });
    }
  });

  return project;
}
