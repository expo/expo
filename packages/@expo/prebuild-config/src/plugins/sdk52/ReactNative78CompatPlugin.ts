import {
  withAppBuildGradle,
  withProjectBuildGradle,
  type ConfigPlugin,
} from '@expo/config-plugins';
import JsonFile from '@expo/json-file';
import resolveFrom from 'resolve-from';
import semver from 'semver';

let cachedIsTargetSdkVersion: boolean | undefined = undefined;

// TODO(kudo,20241210): Remove this plugin when we drop support for SDK 52.
export const withSdk52ReactNative78CompatAndroid: ConfigPlugin = (config) => {
  config = withSdk52ReactNative78CompatAndroidAppGradle(config);
  config = withSdk52ReactNative78CompatAndroidProjectGradle(config);
  return config;
};

const withSdk52ReactNative78CompatAndroidAppGradle: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, async (config) => {
    if (!isTargetSdkVersionAsync(config.modRequest.projectRoot, config.sdkVersion)) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(
      /jscFlavor = ['"]org\.webkit:android-jsc(-intl)?:\+['"]/gm,
      `jscFlavor = 'io.github.react-native-community:jsc-android$1:2026004.+'`
    );
    return config;
  });
};

const withSdk52ReactNative78CompatAndroidProjectGradle: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, async (config) => {
    if (!isTargetSdkVersionAsync(config.modRequest.projectRoot, config.sdkVersion)) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(
      /\ndef jscAndroidDir = new File\([\s\S]+?^\)\n/gm,
      ''
    );
    config.modResults.contents = config.modResults.contents.replace(
      /^\s+maven \{\n\s+\/\/ Android JSC.*\n\s+url\(jscAndroidDir\)[\s\S]+?\}\n/gm,
      ''
    );
    return config;
  });
};

async function isTargetSdkVersionAsync(
  projectRoot: string,
  sdkVersion: string | undefined
): Promise<boolean> {
  if (cachedIsTargetSdkVersion !== undefined) {
    return cachedIsTargetSdkVersion;
  }

  cachedIsTargetSdkVersion = false;
  if (sdkVersion === '52.0.0') {
    const reactNativeVersion = await queryReactNativeVersionAsync(projectRoot);
    if (reactNativeVersion && semver.gte(reactNativeVersion, '0.78.0')) {
      cachedIsTargetSdkVersion = true;
    }
  }
  return cachedIsTargetSdkVersion;
}

async function queryReactNativeVersionAsync(projectRoot: string): Promise<semver.SemVer | null> {
  const packageJsonPath = resolveFrom.silent(projectRoot, 'react-native/package.json');
  if (packageJsonPath) {
    const packageJson = await JsonFile.readAsync(packageJsonPath);
    const version = packageJson.version;
    if (typeof version === 'string') {
      return semver.parse(version);
    }
  }
  return null;
}
