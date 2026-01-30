import { ExpoConfig } from 'expo/config';
import fs from 'fs';
import path from 'path';

const EXPO_DEV_CLIENT = 'expo-dev-client';
// We only want to notify the user once
let DID_NOTIFY = false;

const withDevLauncherWarning = (config: ExpoConfig) => {
  if (!DID_NOTIFY && (maybeGetFromPlugins(config) || maybeGetFromPackageJson(config))) {
    DID_NOTIFY = true;

    console.warn("⚠ It seems that you're using `expo-dev-client` with `expo-brownfield`");
    console.warn("`expo-dev-client` isn't currently supported in the isolated brownfield setup");
    console.warn('Please use `expo-dev-menu` instead');
  }
};

const maybeGetFromPlugins = (config: ExpoConfig): boolean => {
  if (!config.plugins) {
    return false;
  }

  config.plugins.forEach((plugin) => {
    if ((Array.isArray(plugin) && plugin[0] === EXPO_DEV_CLIENT) || plugin === EXPO_DEV_CLIENT) {
      return true;
    }
  });

  return false;
};

const maybeGetFromPackageJson = (config: ExpoConfig): boolean => {
  const packageJsonPath = [
    config._internal?.packageJsonPath,
    config._internal?.projectRoot
      ? path.join(config._internal?.projectRoot, 'package.json')
      : undefined,
    path.join(process.cwd(), 'package.json'),
  ].find(ensureIsValidPath);
  if (!packageJsonPath) {
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.dependencies?.[EXPO_DEV_CLIENT]) {
    return true;
  }

  return false;
};

const ensureIsValidPath = (path: string) => {
  return path && fs.existsSync(path);
};

export default withDevLauncherWarning;
