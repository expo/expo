import { ConfigPlugin, createRunOncePlugin, withPlugins } from 'expo/config-plugins';

import withAndroidWidgets from './android/withAndroidWidgets';
import withIosWidgets from './ios/withIosWidgets';
import { WidgetConfig } from './types/WidgetConfig.type';

const pkg = require('../../package.json');

export type ExpoWidgetsConfigPluginProps = {
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

const withWidgets: ConfigPlugin<ExpoWidgetsConfigPluginProps | undefined> = (config, props) => {
  const widgets = props?.widgets ?? [];

  return withPlugins(config, [
    [withAndroidWidgets, { widgets }],
    [withIosWidgets, { ...(props ?? {}), widgets }],
  ]);
};

export default createRunOncePlugin(withWidgets, pkg.name, pkg.version);
