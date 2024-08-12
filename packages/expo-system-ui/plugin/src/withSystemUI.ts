import { ConfigPlugin, createRunOncePlugin, withPlugins } from 'expo/config-plugins';

import { withAndroidEdgeToEdgeTheme } from './withAndroidEdgeToEdgeTheme';
import { withAndroidGradleEdgeToEdgeProperty } from './withAndroidGradleEdgeToEdgeProperty';
import { withAndroidRootViewBackgroundColor } from './withAndroidRootViewBackgroundColor';
import { withAndroidUserInterfaceStyle } from './withAndroidUserInterfaceStyle';
import { withIosRootViewBackgroundColor } from './withIosRootViewBackgroundColor';
import { withIosUserInterfaceStyle } from './withIosUserInterfaceStyle';

const pkg = require('expo-system-ui/package.json');

const withSystemUI: ConfigPlugin = (config) => {
  return withPlugins(config, [
    withAndroidRootViewBackgroundColor,
    withIosRootViewBackgroundColor,
    withAndroidUserInterfaceStyle,
    withIosUserInterfaceStyle,
    withAndroidEdgeToEdgeTheme,
    withAndroidGradleEdgeToEdgeProperty,
  ]);
};

export default createRunOncePlugin(withSystemUI, pkg.name, pkg.version);
