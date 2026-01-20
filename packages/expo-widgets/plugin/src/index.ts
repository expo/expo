import { ConfigPlugin, createRunOncePlugin, withPlugins } from 'expo/config-plugins';

import { WidgetConfig } from './types/WidgetConfig.type';
import withAppGroupEntitlements from './withAppGroupEntitlements';
import withAppInfoPlist from './withAppInfoPlist';
import withPodsLinking from './withPodsLinking';
import withPushNotifications from './withPushNotifications';
import withWidgetSourceFiles from './withWidgetSourceFiles';
import withTargetXcodeProject from './xcode/withTargetXcodeProject';

const pkg = require('expo-widgets/package.json');

type ExpoWidgetsConfigPluginProps = {
  // Widget target app bundle identifier. Defaults to `<main app bundle identifier>.ExpoWidgetsTarget`.
  bundleIdentifier?: string;
  // App group identifier used for communication between the main app and widgets. Defaults to `group.<main app bundle identifier>`.
  groupIdentifier?: string;
  // Enable push notifications for widgets. Defaults to false.
  enablePushNotifications?: boolean;
  // Enable frequent updates for widgets. Defaults to false.
  frequentUpdates?: boolean;
  widgets?: WidgetConfig[];
};

const withWidgets: ConfigPlugin<ExpoWidgetsConfigPluginProps> = (config, props) => {
  const deploymentTarget = '16.2';
  const targetName = 'ExpoWidgetsTarget';

  let bundleIdentifier = props.bundleIdentifier;
  if (!bundleIdentifier) {
    bundleIdentifier = `${config.ios?.bundleIdentifier}.${targetName}`;
    console.log(`No bundleIdentifier provided, fallback to: ${bundleIdentifier}`);
  }

  let groupIdentifier = props.groupIdentifier;
  if (!groupIdentifier) {
    if (!config.ios?.bundleIdentifier) {
      throw new Error(
        'iOS bundle identifier is required. Please set `ios.bundleIdentifier` in `app.json` or `app.config.js`'
      );
    }
    groupIdentifier = `group.${config.ios.bundleIdentifier}`;
    console.log(`No groupIdentifier provided, fallback to: ${groupIdentifier}`);
  }

  let widgets = props.widgets;
  if (!widgets) {
    widgets = [];
  }

  const enablePushNotifications = props.enablePushNotifications ?? false;
  const frequentUpdates = props.frequentUpdates ?? false;

  let sharedFiles: string[] = [];
  const setFiles = (files: string[]) => {
    sharedFiles = [...sharedFiles, ...files];
  };
  const getFileUris = () => sharedFiles;

  return withPlugins(config, [
    [withPodsLinking, { targetName }],
    [withWidgetSourceFiles, { targetName, widgets, groupIdentifier, onFilesGenerated: setFiles }],
    [withAppInfoPlist, { frequentUpdates, groupIdentifier }],
    [withPushNotifications, { enablePushNotifications }],
    [withAppGroupEntitlements, { groupIdentifier }],
    [withTargetXcodeProject, { targetName, bundleIdentifier, deploymentTarget, getFileUris }],
  ]);
};

export default createRunOncePlugin(withWidgets, pkg.name, pkg.version);
