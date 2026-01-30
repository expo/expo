import type { ConfigPlugin } from 'expo/config-plugins';

import withAndroidPlugin from './android';
import { withDevLauncherWarning } from './common';
import withIosPlugin from './ios';
import type { PluginProps } from './types';

const withExpoBrownfieldTargetPlugin: ConfigPlugin<PluginProps> = (config, props) => {
  // Warn the user that `expo-dev-launcher` is not supported with `expo-brownfield` yet
  withDevLauncherWarning(config);
  config = withAndroidPlugin(config, props?.android);
  return withIosPlugin(config, props?.ios);
};

export default withExpoBrownfieldTargetPlugin;
