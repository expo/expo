import { ConfigPlugin, createRunOncePlugin, withPlugins } from 'expo/config-plugins';

import { WidgetConfig } from './types/WidgetConfig.type';
import withAppGroupEntitlements from './withAppGroupEntitlements';
import withAppInfoPlist from './withAppInfoPlist';
import withPodsLinking from './withPodsLinking';
import withPushNotifications from './withPushNotifications';
import withWidgetSourceFiles from './withWidgetSourceFiles';
import withTargetXcodeProject from './xcode/withTargetXcodeProject';

const pkg = require('expo-widgets/package.json');

interface ExpoWidgetsConfigPluginProps {
  // App group identifier - it is used for communication between the main app and widgets
  groupIdentifier: string;
  enablePushNotifications?: boolean;
  widgets: WidgetConfig[];
}

const withWidgets: ConfigPlugin<ExpoWidgetsConfigPluginProps> = (
  config,
  { groupIdentifier, enablePushNotifications, widgets }
) => {
  if (!groupIdentifier) {
    throw new Error(
      'App Group Identifier is required to configure widgets. Please provide a valid groupIdentifier.'
    );
  }
  if (!widgets) {
    throw new Error(
      'Widget names are required to configure widgets. Please provide at least one widget name.'
    );
  }
  if (!config.ios?.bundleIdentifier) {
    throw new Error(
      'iOS bundle identifier is required to configure widgets. Please set ios.bundleIdentifier in app.json or app.config.js'
    );
  }

  const deploymentTarget = '16.2';
  const targetName = 'ExpoWidgetsTarget';
  const targetBundleIdentifier = `${config.ios.bundleIdentifier}.${targetName}`;
  // It is disabled by default because it may impact battery life
  const frequentUpdates = false;

  let sharedFiles: string[] = [];
  const setFiles = (files: string[]) => {
    sharedFiles = [...sharedFiles, ...files];
  };
  const getFiles = () => sharedFiles;
  return withPlugins(config, [
    [withPodsLinking, { targetName }],
    [
      withWidgetSourceFiles,
      {
        targetName,
        widgets,
        groupIdentifier,
        bundleIdentifier: config.ios.bundleIdentifier,
        onFilesGenerated: setFiles,
      },
    ],
    [withAppInfoPlist, { frequentUpdates, groupIdentifier }],
    [withPushNotifications, { enablePushNotifications: enablePushNotifications ?? false }],
    [withAppGroupEntitlements, { targetName, targetBundleIdentifier, groupIdentifier }],
    [
      withTargetXcodeProject,
      {
        targetName,
        targetBundleIdentifier,
        deploymentTarget,
        getFileUris: getFiles,
      },
    ],
  ]);
};

export default createRunOncePlugin(withWidgets, pkg.name, pkg.version);
