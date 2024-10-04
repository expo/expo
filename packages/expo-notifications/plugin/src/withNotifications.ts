import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withNotificationsAndroid } from './withNotificationsAndroid';
import { withNotificationsIOS } from './withNotificationsIOS';

const pkg = require('expo-notifications/package.json');

export type NotificationsPluginProps = {
  /**
   * Local path to an image to use as the icon for push notifications.
   * 96x96 all-white png with transparency. We recommend following
   * [Google's design guidelines](https://material.io/design/iconography/product-icons.html#design-principles).
   * @platform android
   */
  icon?: string;
  /**
   * Tint color for the push notification image when it appears in the notification tray.
   * @default '#ffffff'
   * @platform android
   */
  color?: string;
  /**
   * Default channel for FCMv1 notifications.
   * @platform android
   */
  defaultChannel?: string;
  /**
   * Array of local paths to sound files (.wav recommended) that can be used as custom notification sounds.
   */
  sounds?: string[];
  /**
   * Environment of the app: either 'development' or 'production'.
   * @default 'development'
   * @platform ios
   */
  mode?: 'development' | 'production';
};

const withNotifications: ConfigPlugin<NotificationsPluginProps | void> = (config, props) => {
  config = withNotificationsAndroid(config, props || {});
  config = withNotificationsIOS(config, props || {});
  return config;
};

export default createRunOncePlugin(withNotifications, pkg.name, pkg.version);
