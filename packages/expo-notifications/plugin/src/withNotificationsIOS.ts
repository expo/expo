import {
  ConfigPlugin,
  withEntitlementsPlist,
  IOSConfig,
  withXcodeProject,
  XcodeProject,
  withInfoPlist,
} from 'expo/config-plugins';
import { copyFileSync } from 'fs';
import { basename, resolve } from 'path';

import { NotificationsPluginProps } from './withNotifications';

const ERROR_MSG_PREFIX = 'An error occurred while configuring iOS notifications. ';

export const withNotificationsIOS: ConfigPlugin<NotificationsPluginProps> = (
  config,
  { mode = 'development', sounds = [], enableBackgroundRemoteNotifications }
) => {
  config = withEntitlementsPlist(config, (config) => {
    if (!config.modResults['aps-environment']) {
      config.modResults['aps-environment'] = mode;
    }
    return config;
  });
  config = withNotificationSounds(config, { sounds });
  config = withBackgroundRemoteNotifications(config, enableBackgroundRemoteNotifications);

  return config;
};

const withBackgroundRemoteNotifications: ConfigPlugin<boolean | undefined> = (
  config,
  enableBackgroundRemoteNotifications
) => {
  if (
    !(
      enableBackgroundRemoteNotifications === undefined ||
      typeof enableBackgroundRemoteNotifications === 'boolean'
    )
  ) {
    throw new Error(
      ERROR_MSG_PREFIX +
        `"enableBackgroundRemoteNotifications" has an invalid value: ${enableBackgroundRemoteNotifications}. Expected a boolean.`
    );
  }
  if (!enableBackgroundRemoteNotifications) {
    return config;
  }
  return withInfoPlist(config, (config) => {
    if (!Array.isArray(config.modResults.UIBackgroundModes)) {
      config.modResults.UIBackgroundModes = [];
    }
    const notificationBackgroundMode = 'remote-notification';
    if (!config.modResults.UIBackgroundModes.includes(notificationBackgroundMode)) {
      config.modResults.UIBackgroundModes.push(notificationBackgroundMode);
    }
    return config;
  });
};

const withNotificationSounds: ConfigPlugin<{ sounds: string[] }> = (config, { sounds }) => {
  return withXcodeProject(config, (config) => {
    setNotificationSounds(config.modRequest.projectRoot, {
      sounds,
      project: config.modResults,
      projectName: config.modRequest.projectName,
    });
    return config;
  });
};

/**
 * Save sound files to the Xcode project root and add them to the Xcode project.
 */
export function setNotificationSounds(
  projectRoot: string,
  {
    sounds,
    project,
    projectName,
  }: { sounds: string[]; project: XcodeProject; projectName: string | undefined }
): XcodeProject {
  if (!projectName) {
    throw new Error(ERROR_MSG_PREFIX + `Unable to find iOS project name.`);
  }
  if (!Array.isArray(sounds)) {
    throw new Error(
      ERROR_MSG_PREFIX +
        `Must provide an array of sound files in your app config, found ${typeof sounds}.`
    );
  }
  const sourceRoot = IOSConfig.Paths.getSourceRoot(projectRoot);
  for (const soundFileRelativePath of sounds) {
    const fileName = basename(soundFileRelativePath);
    const sourceFilepath = resolve(projectRoot, soundFileRelativePath);
    const destinationFilepath = resolve(sourceRoot, fileName);

    // Since it's possible that the filename is the same, but the
    // file itself id different, let's copy it regardless
    copyFileSync(sourceFilepath, destinationFilepath);
    if (!project.hasFile(`${projectName}/${fileName}`)) {
      project = IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: `${projectName}/${fileName}`,
        groupName: projectName,
        isBuildFile: true,
        project,
      });
    }
  }

  return project;
}
