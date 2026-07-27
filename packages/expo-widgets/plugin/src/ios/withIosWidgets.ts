import { ConfigPlugin, StaticPlugin, withPlugins } from 'expo/config-plugins';

import withAppGroupEntitlements from './withAppGroupEntitlements';
import withAppInfoPlist from './withAppInfoPlist';
import withEasConfig from './withEasConfig';
import withIosWarning from './withIosWarning';
import withPodsLinking from './withPodsLinking';
import withPushNotifications from './withPushNotifications';
import withWidgetSourceFiles from './withWidgetSourceFiles';
import { WidgetConfig } from '../types/WidgetConfig.type';
import withTargetXcodeProject from './xcode/withTargetXcodeProject';

type IosWidgetsProps = {
  bundleIdentifier?: string;
  groupIdentifier?: string;
  enablePushNotifications?: boolean;
  frequentUpdates?: boolean;
  widgets: WidgetConfig[];
};

const withIosWidgets: ConfigPlugin<IosWidgetsProps> = (config, props) => {
  const shouldConfigureIos =
    !!config.ios?.bundleIdentifier ||
    !!props.bundleIdentifier ||
    !!props.groupIdentifier ||
    props.enablePushNotifications === true ||
    props.frequentUpdates === true;

  if (!shouldConfigureIos) {
    return config;
  }

  let plugins: (StaticPlugin | ConfigPlugin | string)[] = [];
  const deploymentTarget = config.ios?.deploymentTarget ?? '16.4';
  const targetName = 'ExpoWidgetsTarget';
  const widgets = props.widgets.filter((widget) => widget.ios !== null);

  const enablePushNotifications = props.enablePushNotifications ?? false;
  const frequentUpdates = props.frequentUpdates ?? false;

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

export default withIosWidgets;
