import { ConfigPlugin, withEntitlementsPlist, withInfoPlist } from 'expo/config-plugins';

interface PushNotificationProps {
  enablePushNotifications: boolean;
}

const withPushNotifications: ConfigPlugin<PushNotificationProps> = (
  config,
  { enablePushNotifications }
) =>
  withInfoPlist(
    withEntitlementsPlist(config, (mod) => {
      mod.modResults['aps-environment'] = 'development';
      return mod;
    }),
    (mod) => {
      mod.modResults['ExpoLiveActivity_EnablePushNotifications'] = enablePushNotifications;
      return mod;
    }
  );

export default withPushNotifications;
