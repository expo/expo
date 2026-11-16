import { AndroidConfig, ConfigPlugin, withAndroidManifest } from 'expo/config-plugins';

type NotificationPermissionProps = {
  enablePushNotifications: boolean;
};

const withAndroidNotificationPermission: ConfigPlugin<NotificationPermissionProps> = (
  config,
  props
) => {
  if (!props.enablePushNotifications) {
    return config;
  }
  return withAndroidManifest(config, (config) => {
    AndroidConfig.Permissions.ensurePermissions(config.modResults, [
      'android.permission.POST_NOTIFICATIONS',
    ]);
    return config;
  });
};

export default withAndroidNotificationPermission;
