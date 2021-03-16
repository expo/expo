import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withAdMobAndroid } from './withAdMobAndroid';
import { withAdMobIOS, withUserTrackingPermission } from './withAdMobIOS';

const pkg = require('expo-ads-admob/package.json');

const withAdMob: ConfigPlugin<{
  userTrackingPermission?: string;
} | void> = (config, props) => {
  config = withAdMobAndroid(config);
  config = withAdMobIOS(config);
  config = withUserTrackingPermission(config, props);
  return config;
};

export default createRunOncePlugin(withAdMob, pkg.name, pkg.version);
