import type { ExpoConfig } from 'expo/config';
import { createRunOncePlugin } from 'expo/config-plugins';
// @ts-expect-error missing types
import withDevMenu from 'expo-dev-menu/app.plugin';

import { withGeneratedAndroidScheme } from './withGeneratedAndroidScheme';
import { withGeneratedIosScheme } from './withGeneratedIosScheme';

const pkg = require('expo-dev-client/package.json');

type DevClientPluginConfigType = {
  addGeneratedScheme?: boolean;
};

function withDevClient(config: ExpoConfig, props: DevClientPluginConfigType) {
  config = withDevMenu(config);

  const mySchemeProps = { addGeneratedScheme: true, ...props };

  if (mySchemeProps.addGeneratedScheme) {
    config = withGeneratedAndroidScheme(config);
    config = withGeneratedIosScheme(config);
  }
  return config;
}

export default createRunOncePlugin<DevClientPluginConfigType>(withDevClient, pkg.name, pkg.version);
