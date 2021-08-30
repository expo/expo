import { getConfig } from '@expo/config';
import { compileModsAsync } from '@expo/config-plugins';
import { withAndroidExpoPlugins, withIosExpoPlugins } from '@expo/prebuild-config';
import fs from 'fs';
import path from 'path';

import { getPackageRoot, getProjectRoot, getTargetName, getTemplateRoot } from '../helpers';

// Runs mods (much like prebuild) but omits the default packages that come with prebuild
// Merges a smaller subset of default plugins, target package plugins, and plugins that expo-stories needs to generate a working project
export async function runPrebuildAsync(packageName: string) {
  const targetName = getTargetName(packageName);
  const projectRoot = getProjectRoot(packageName);

  // this will install dev client dependencies by default - remove
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

  const packageRoot = getPackageRoot(packageName);
  const packagePlugin = path.resolve(packageRoot, 'app.plugin.js');

  const templateRoot = getTemplateRoot(packageName);
  const defaultAppJson = require(path.resolve(templateRoot, 'app.json'));

  appJson.expo.plugins = [...defaultAppJson.expo.plugins];

  if (fs.existsSync(packagePlugin)) {
    appJson.expo.plugins.push(packageName);
  }

  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2), { encoding: 'utf-8' });

  let { exp: config } = getConfig(projectRoot, {
    skipSDKVersionRequirement: true,
    isModdedConfig: true,
  });

  // // Add all android built-in plugins
  if (!config.android) config.android = {};
  config.android.package = packageName ?? config.android.package ?? bundleId;
  config = withAndroidExpoPlugins(config, {
    package: config.android.package,
  });

  // // Add all ios built-in plugins
  if (!config.ios) config.ios = {};
  config.ios.bundleIdentifier = config.ios.bundleIdentifier ?? bundleId;
  config = withIosExpoPlugins(config, {
    bundleIdentifier: config.ios.bundleIdentifier,
  });

  return await compileModsAsync(config, {
    projectRoot,
  });
}
