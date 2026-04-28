import { ConfigPlugin, withEntitlementsPlist } from 'expo/config-plugins';

import withInfoPlistValues from './withInfoPlistValues';

type PushNotificationProps = {
  enablePushNotifications: boolean;
};

const withPushNotifications: ConfigPlugin<PushNotificationProps> = (config, props) =>
  withInfoPlistValues(
    withEntitlementsPlist(config, (mod) => {
      mod.modResults['aps-environment'] = 'development';
      return mod;
    }),
    {
      ExpoWidgets_EnablePushNotifications: props.enablePushNotifications,
    }
  );

export default withPushNotifications;
