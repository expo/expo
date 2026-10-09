import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withNotificationsAndroid } from './withNotificationsAndroid';
import { withNotificationsIOS } from './withNotificationsIOS';

const pkg = require('../../package.json');

export type NotificationsPluginProps = {
  /**
   * Local path to an image to use as the icon for push notifications.
   * 96x96 all-white png with transparency. We recommend following
   * [Google's design guidelines](https://material.io/design/iconography/product-icons.html#design-principles).
   * @platform android
   */
  icon?: string;
  /**
   * Local path to an image to use as the large icon for notifications. The image is resized to
   * 64x64 dp and shown next to the notification text. A notification that carries its own image
   * uses that image instead.
   * @platform android
   */
  largeIcon?: string;
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
   * Whether to present a notification when the app receives a data-only FCM message (a message without
   * a `notification` key) that has `title` or `message` in `data`, while the app is not in the foreground.
   *
   * By default, such messages are presented and a deprecation warning is logged.
   * Set to `false` to never present them. This will be the default in SDK 59.
   * Set to `true` to keep presenting them. A deprecation warning is still logged, and this option
   * is removed in SDK 60, when these messages are no longer presented.
   *
   * To show a notification, send a Notification Message instead. To run code first, handle the message in a
   * task registered with `registerTaskAsync` and call `scheduleNotificationAsync`.
   * @platform android
   */
  presentDataOnlyNotificationsWithTitle?: boolean;
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

  /**
   * Whether to enable remote notifications.
   *
   * If set to `false`, the plugin does not add the `aps-environment` entitlement to the native project,
   * and only local notifications work. `mode` has no effect.
   * @default true
   * @platform ios
   */
  enableRemoteNotifications?: boolean;

  /**
   * Whether to enable background remote notifications, as described in [Apple documentation](https://developer.apple.com/documentation/usernotifications/pushing-background-updates-to-your-app).
   *
   * This sets the `UIBackgroundModes` key in the `Info.plist` to include `remote-notification`.
   * @default false
   * @platform ios
   */
  enableBackgroundRemoteNotifications?: boolean;
};

const withNotifications: ConfigPlugin<NotificationsPluginProps | void> = (config, props) => {
  config = withNotificationsAndroid(config, props || {});
  config = withNotificationsIOS(config, props || {});
  return config;
};

export default createRunOncePlugin(withNotifications, pkg.name, pkg.version);
