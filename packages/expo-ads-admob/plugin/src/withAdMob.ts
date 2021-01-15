import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withAdMobAndroid } from './withAdMobAndroid';
import { withAdMobIOS } from './withAdMobIOS';

const pkg = require('expo-ads-admob/package.json');

const withAdMob: ConfigPlugin = config => {
  config = withAdMobAndroid(config);
  config = withAdMobIOS(config);
  return config;
};

export default createRunOncePlugin(withAdMob, pkg.name, pkg.version);
