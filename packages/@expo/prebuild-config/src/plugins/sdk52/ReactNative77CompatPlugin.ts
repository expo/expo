import { withProjectBuildGradle, WarningAggregator, type ConfigPlugin } from '@expo/config-plugins';
import JsonFile from '@expo/json-file';
import resolveFrom from 'resolve-from';
import semver from 'semver';

// TODO(kudo,20241112): Remove this plugin when we drop support for SDK 52.
export const withSdk52ReactNative77CompatAndroid: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, async (config) => {
    if (config.sdkVersion !== '52.0.0') {
      return config;
    }
    const reactNativeVersion = await queryReactNativeVersionAsync(config.modRequest.projectRoot);
    if (!reactNativeVersion || semver.lt(reactNativeVersion, '0.77.0')) {
      return config;
    }

    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setProjectBuildGradle(config.modResults.contents);
    } else {
      WarningAggregator.addWarningAndroid(
        'ReactNative77CompatPlugin',
        `Cannot automatically configure project build.gradle if it's not groovy`
      );
    }
    return config;
  });
};

function setProjectBuildGradle(contents: string): string {
  // Update kotlinVersion
  const kotlinVersion = '2.0.21';
  let newContents = contents.replace(
    /\b(kotlinVersion\s*=\s*findProperty\('android.kotlinVersion'\)\s*\?: ['"])(1\.9\.\d+)(['"])/g,
    `$1${kotlinVersion}$3`
  );

  // Update ndkVersion
  const ndkVersion = '27.1.12297006';
  newContents = newContents.replace(
    /\b(ndkVersion\s*=\s*['"])(26.1.10909125)(['"])/g,
    `$1${ndkVersion}$3`
  );

  return newContents;
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
