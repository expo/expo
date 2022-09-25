import { createRunOncePlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
// @ts-expect-error missing types
import withDevLauncher from 'expo-dev-launcher/app.plugin';
// @ts-expect-error missing types
import withDevMenu from 'expo-dev-menu/app.plugin';

import { withGeneratedAndroidScheme } from './withGeneratedAndroidScheme';
import { withGeneratedIosScheme } from './withGeneratedIosScheme';

const pkg = require('expo-dev-client/package.json');

function withDevClient(config: ExpoConfig) {
  config = withDevMenu(config);
  config = withDevLauncher(config);
  config = withGeneratedAndroidScheme(config);
  config = withGeneratedIosScheme(config);
  return config;
}

export default createRunOncePlugin(withDevClient, pkg.name, pkg.version);
