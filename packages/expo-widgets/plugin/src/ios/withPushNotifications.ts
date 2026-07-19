import { ConfigPlugin, withEntitlementsPlist, withInfoPlist } from 'expo/config-plugins';

type PushNotificationProps = {
  enablePushNotifications: boolean;
};

const withPushNotifications: ConfigPlugin<PushNotificationProps> = (config, props) => {
  if (props.enablePushNotifications) {
    config = withEntitlementsPlist(config, (mod) => {
      if (!mod.modResults['aps-environment']) {
        mod.modResults['aps-environment'] = 'development';
      }
      return mod;
    });
  }
  return withInfoPlist(config, (mod) => {
    mod.modResults['ExpoWidgets_EnablePushNotifications'] = props.enablePushNotifications;
    return mod;
  });
};

export default withPushNotifications;
