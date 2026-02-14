import { ConfigPlugin, createRunOncePlugin, StaticPlugin, withPlugins } from 'expo/config-plugins';

import { WidgetConfig } from './types/WidgetConfig.type';
import withAppGroupEntitlements from './withAppGroupEntitlements';
import withAppInfoPlist from './withAppInfoPlist';
import withEasConfig from './withEasConfig';
import withIosWarning from './withIosWarning';
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
  let plugins: (StaticPlugin | ConfigPlugin | string)[] = [];
  const deploymentTarget = '16.2';
  const targetName = 'ExpoWidgetsTarget';

  let bundleIdentifier = props.bundleIdentifier;
  if (!bundleIdentifier) {
    bundleIdentifier = `${config.ios?.bundleIdentifier}.${targetName}`;
    plugins.push([
      withIosWarning,
      {
        property: 'bundleIdentifier',
        warning: `Expo Widgets: No bundle identifier provided, using fallback: ${bundleIdentifier}.`,
      },
    ]);
  }

  let groupIdentifier = props.groupIdentifier;
  if (!groupIdentifier) {
    if (!config.ios?.bundleIdentifier) {
      throw new Error(
        'iOS bundle identifier is required. Please set `ios.bundleIdentifier` in `app.json` or `app.config.js`'
      );
    }
    groupIdentifier = `group.${config.ios.bundleIdentifier}`;
    plugins.push([
      withIosWarning,
      {
        property: 'groupIdentifier',
        warning: `Expo Widgets: No group identifier provided, using fallback: ${groupIdentifier}.`,
      },
    ]);
  }

  const widgets = props.widgets ?? [];
  const enablePushNotifications = props.enablePushNotifications ?? false;
  const frequentUpdates = props.frequentUpdates ?? false;

  let sharedFiles: string[] = [];
  const setFiles = (files: string[]) => {
    sharedFiles = [...sharedFiles, ...files];
  };
  const getFileUris = () => sharedFiles;

  plugins = [
    ...plugins,
    [withEasConfig, { targetName, bundleIdentifier, groupIdentifier }],
    [withPodsLinking, { targetName }],
    [withWidgetSourceFiles, { targetName, widgets, groupIdentifier, onFilesGenerated: setFiles }],
    [withAppInfoPlist, { frequentUpdates, groupIdentifier }],
    [withPushNotifications, { enablePushNotifications }],
    [withAppGroupEntitlements, { groupIdentifier }],
    [
      withTargetXcodeProject,
      {
        targetName,
        bundleIdentifier,
        deploymentTarget,
        appleTeamId: config.ios?.appleTeamId,
        getFileUris,
      },
    ],
  ];

  return withPlugins(config, plugins);
};

export default createRunOncePlugin(withWidgets, pkg.name, pkg.version);
