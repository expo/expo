import type { ConfigPlugin } from 'expo/config-plugins';

import withAndroidPlugin from './android';
import { resolveBundleInDebug, withDevLauncherWarning } from './common';
import withIosPlugin from './ios';
import type { PluginProps } from './types';

const withExpoBrownfieldTargetPlugin: ConfigPlugin<PluginProps> = (config, props) => {
  // Warn the user that `expo-dev-launcher` is not supported with `expo-brownfield` yet
  withDevLauncherWarning(config);
  config = withAndroidPlugin(config, {
    ...props?.android,
    bundleInDebug: resolveBundleInDebug(props?.android, props?.bundleInDebug),
  });
  return withIosPlugin(config, {
    ...props?.ios,
    bundleInDebug: resolveBundleInDebug(props?.ios, props?.bundleInDebug),
  });
};

export default withExpoBrownfieldTargetPlugin;
