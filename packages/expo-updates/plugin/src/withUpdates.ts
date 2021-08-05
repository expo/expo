import { getAccountUsername } from '@expo/config';
import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withUpdatesAndroid } from './withUpdatesAndroid';
import { withUpdatesIOS } from './withUpdatesIOS';

const pkg = require('expo-updates/package.json');

const withUpdates: ConfigPlugin<{ expoUsername?: string } | void> = (config, props = {}) => {
  // The username will be passed from the CLI when the plugin is automatically used.
  const expoUsername = (props || {}).expoUsername ?? getAccountUsername(config);

  config = withUpdatesAndroid(config, { expoUsername });
  config = withUpdatesIOS(config, { expoUsername });
  return config;
};

export default createRunOncePlugin(withUpdates, pkg.name, pkg.version);
