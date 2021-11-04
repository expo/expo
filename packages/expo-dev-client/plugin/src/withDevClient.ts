import { createRunOncePlugin, Mod, withDangerousMod } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
// @ts-expect-error missing types
import withDevLauncher from 'expo-dev-launcher/app.plugin';
// @ts-expect-error missing types
import withDevMenu from 'expo-dev-menu/app.plugin';
import fs from 'fs';
import path from 'path';

import { InstallationPage } from './constants';
import { withGeneratedAndroidScheme } from './withGeneratedAndroidScheme';
import { withGeneratedIosScheme } from './withGeneratedIosScheme';

const pkg = require('expo-dev-client/package.json');

const REACT_NATIVE_CONFIG_JS = `// File created by expo-dev-client/app.plugin.js

module.exports = {
  dependencies: {
    ...require('expo-dev-client/dependencies'),
  },
};
`;

function withReactNativeConfigJs(config: ExpoConfig): ExpoConfig {
  config = withDangerousMod(config, ['android', addReactNativeConfigAsync]);
  config = withDangerousMod(config, ['ios', addReactNativeConfigAsync]);
  return config;
}

const addReactNativeConfigAsync: Mod = async (config) => {
  const filename = path.join(config.modRequest.projectRoot, 'react-native.config.js');
  try {
    const config = fs.readFileSync(filename, 'utf8');
    if (!config.includes('expo-dev-client/dependencies')) {
      throw new Error(
        `Could not add expo-dev-client dependencies to existing file ${filename}. See expo-dev-client installation instructions to add them manually: ${InstallationPage}`
      );
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // The file doesn't exist, so we create it.
      fs.writeFileSync(filename, REACT_NATIVE_CONFIG_JS);
    } else {
      throw error;
    }
  }
  return config;
};

function withDevClient(config: ExpoConfig) {
  config = withDevMenu(config);
  config = withDevLauncher(config);
  config = withReactNativeConfigJs(config);
  config = withGeneratedAndroidScheme(config);
  config = withGeneratedIosScheme(config);
  return config;
}

export default createRunOncePlugin(withDevClient, pkg.name, pkg.version);
