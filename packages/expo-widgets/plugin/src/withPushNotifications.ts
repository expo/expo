import { ConfigPlugin, withEntitlementsPlist, withInfoPlist } from 'expo/config-plugins';

type PushNotificationProps = {
  enablePushNotifications: boolean;
};

const withPushNotifications: ConfigPlugin<PushNotificationProps> = (config, props) =>
  withInfoPlist(
    withEntitlementsPlist(config, (mod) => {
      mod.modResults['aps-environment'] = 'development';
      return mod;
    }),
    (mod) => {
      mod.modResults['ExpoLiveActivity_EnablePushNotifications'] = props.enablePushNotifications;
      return mod;
    }
  );

export default withPushNotifications;
