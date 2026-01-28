import type { ExpoConfig } from 'expo/config';
import fs from 'fs';
import path from 'path';

export const checkPlugin = (config: ExpoConfig, pluginName: string): boolean => {
  return checkExpoConfig(config, pluginName) || checkPackageJson(config, pluginName);
};

/**
 * Check if the plugin is specified in the expo config
 */
const checkExpoConfig = (config: ExpoConfig, pluginName: string): boolean => {
  if (!config.plugins) {
    return false;
  }

  config.plugins.forEach((plugin) => {
    if ((Array.isArray(plugin) && plugin[0] === pluginName) || plugin === pluginName) {
      return true;
    }
  });

  return false;
};

/**
 * Check if the plugin is installed in the package.json
 */
const checkPackageJson = (config: ExpoConfig, pluginName: string): boolean => {
  const packageJsonPath = [
    config._internal?.packageJsonPath,
    config._internal?.projectRoot
      ? path.join(config._internal?.projectRoot, 'package.json')
      : undefined,
    path.join(process.cwd(), 'package.json'),
  ].find((filepath) => filepath && fs.existsSync(filepath));
  if (!packageJsonPath) {
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (
    packageJson.dependencies?.[pluginName] ||
    packageJson.devDependencies?.[pluginName] ||
    packageJson.peerDependencies?.[pluginName]
  ) {
    return true;
  }

  return false;
};
