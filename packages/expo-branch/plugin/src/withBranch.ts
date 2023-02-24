import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withBranchAndroid } from './withBranchAndroid';
import { withBranchIOS } from './withBranchIOS';

const pkg = require('expo-branch/package.json');

const withBranch: ConfigPlugin = (config) => {
  config = withBranchAndroid(config);
  config = withBranchIOS(config);
  return config;
};

export default createRunOncePlugin(withBranch, pkg.name, pkg.version);
