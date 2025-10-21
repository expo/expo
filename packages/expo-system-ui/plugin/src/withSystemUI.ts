import { ConfigPlugin, createRunOncePlugin, withPlugins } from 'expo/config-plugins';

import { withAndroidRootViewBackgroundColor } from './withAndroidRootViewBackgroundColor';
import { withAndroidUserInterfaceStyle } from './withAndroidUserInterfaceStyle';
import { withIosRootViewBackgroundColor } from './withIosRootViewBackgroundColor';
import { withIosUserInterfaceStyle } from './withIosUserInterfaceStyle';
import { withMaterial3DynamicColorsTheme } from './withMaterial3DynamicColorsTheme';

const pkg = require('expo-system-ui/package.json');

const withSystemUI: ConfigPlugin = (config) => {
  return withPlugins(config, [
    withAndroidRootViewBackgroundColor,
    withIosRootViewBackgroundColor,
    withAndroidUserInterfaceStyle,
    withIosUserInterfaceStyle,
    withMaterial3DynamicColorsTheme,
  ]);
};

export default createRunOncePlugin(withSystemUI, pkg.name, pkg.version);
