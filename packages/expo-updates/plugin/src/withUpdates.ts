import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withUpdatesAndroid } from './withUpdatesAndroid';
import { withUpdatesIOS } from './withUpdatesIOS';

const pkg = require('expo-updates/package.json');

const withUpdates: ConfigPlugin<{ expoUsername: string | null }> = (config, props) => {
  config = withUpdatesAndroid(config, props);
  config = withUpdatesIOS(config, props);
  return config;
};

export default createRunOncePlugin(withUpdates, pkg.name, pkg.version);
