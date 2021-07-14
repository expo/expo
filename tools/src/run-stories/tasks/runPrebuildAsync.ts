import { getConfig } from '@expo/config';
import { compileModsAsync } from '@expo/config-plugins';
import { withAndroidExpoPlugins, withIosExpoPlugins } from '@expo/prebuild-config';
import fs from 'fs';
import path from 'path';

import { getPackageRoot, getProjectRoot, getTargetName } from '../helpers';

export async function runPrebuildAsync(packageName: string) {
  const targetName = getTargetName(packageName);
  const projectRoot = getProjectRoot(packageName);

  if (fs.existsSync(path.resolve(projectRoot, 'react-native.config.js'))) {
    fs.unlinkSync(path.resolve(projectRoot, 'react-native.config.js'));
  }

  const appJsonPath = path.resolve(projectRoot, 'app.json');

  const appJson = require(appJsonPath);
  const bundleId = `com.expostories.${targetName}`;

  appJson.expo.android = {
    package: bundleId,
  };

  appJson.expo.ios = {
    bundleIdentifier: bundleId,
  };

  // const legacyPlugins = getLegacyExpoPlugins();
  const packageRoot = getPackageRoot(packageName);

  // const packagePkg = require(path.resolve(packageRoot, 'package.json'));

  // @todo - update logic around applying config plugins
  // search node_modules / deps instead of whatever is in config?
  const packagePlugin = path.resolve(packageRoot, 'app.plugin.js');

  appJson.expo.plugins = [];

  if (fs.existsSync(packagePlugin)) {
    appJson.expo.plugins.push(packageName);
  }

  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, '\t'), { encoding: 'utf-8' });

  let { exp: config } = getConfig(projectRoot, {
    skipSDKVersionRequirement: true,
    isModdedConfig: true,
  });

  // // Add all android built-in plugins
  if (!config.android) config.android = {};
  config.android.package = packageName ?? config.android.package ?? `com.placeholder.appid`;
  config = withAndroidExpoPlugins(config, {
    package: config.android.package,
  });

  // // Add all ios built-in plugins
  if (!config.ios) config.ios = {};
  config.ios.bundleIdentifier = config.ios.bundleIdentifier ?? `com.placeholder.appid`;
  config = withIosExpoPlugins(config, {
    bundleIdentifier: config.ios.bundleIdentifier,
  });

  return await compileModsAsync(config, {
    projectRoot,
    platforms: ['ios', 'android'],
  });
}
