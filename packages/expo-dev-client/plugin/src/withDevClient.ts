import { createRunOncePlugin } from '@expo/config-plugins';
import { ExpoConfig } from 'expo/config';
// @ts-expect-error missing types
import withDevLauncher from 'expo-dev-launcher/app.plugin';
import type { PluginConfigType } from 'expo-dev-launcher/plugin/build/pluginConfig';
// @ts-expect-error missing types
import withDevMenu from 'expo-dev-menu/app.plugin';

import { withGeneratedAndroidScheme } from './withGeneratedAndroidScheme';
import { withGeneratedIosScheme } from './withGeneratedIosScheme';

const pkg = require('expo-dev-client/package.json');

function withDevClient(config: ExpoConfig, props: PluginConfigType) {
  config = withDevMenu(config);
  config = withDevLauncher(config, props);
  config = withGeneratedAndroidScheme(config);
  config = withGeneratedIosScheme(config);
  return config;
}

export default createRunOncePlugin<PluginConfigType>(withDevClient, pkg.name, pkg.version);
