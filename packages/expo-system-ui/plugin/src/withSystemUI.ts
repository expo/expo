import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withAndroidRootViewBackgroundColor } from './withAndroidRootViewBackgroundColor';
import { withIosRootViewBackgroundColor } from './withIosRootViewBackgroundColor';

const pkg = require('expo-system-ui/package.json');

const withSystemUI: ConfigPlugin = (config) => {
  return withAndroidRootViewBackgroundColor(withIosRootViewBackgroundColor(config));
};

export default createRunOncePlugin(withSystemUI, pkg.name, pkg.version);
