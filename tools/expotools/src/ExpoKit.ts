import path from 'path';
import uuid from 'uuid';
import { Versions, Config } from '@expo/xdl';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';

import * as S3 from './S3';

const BUCKET = 'exp-exponent-view-code';

export async function updateExpoKitIosAsync(
  expoDir: string,
  appVersion: string,
  sdkVersion: string
): Promise<void> {
  const key = `ios-v${appVersion.trim().replace(/^v/, '')}-sdk${sdkVersion}-${uuid()}.tar.gz`;

  // TODO: rename the template to expokit-template
  await S3.uploadDirectoriesAsync(BUCKET, key, [
    {
      source: path.join(expoDir, 'exponent-view-template', 'ios'),
      destination: path.join('exponent-view-template', 'ios'),
    },
    {
      source: path.join(expoDir, 'template-files', 'ios'),
      destination: path.join('template-files', 'ios'),
    },
  ]);

  process.env.EXPO_STAGING = '1';
  Config.api.host = 'staging.exp.host';
  let versions = await Versions.versionsAsync();
  if (!versions.sdkVersions[sdkVersion]) {
    throw new Error(`SDK version ${sdkVersion} not found in versions JSON`);
  }

  versions.sdkVersions[sdkVersion].iosExpoViewUrl = `https://s3.amazonaws.com/${BUCKET}/${key}`;

  versions.sdkVersions[sdkVersion].iosVersion = appVersion;
  await Versions.setVersionsAsync(versions);
}

export async function updateReactNativeUnimodulesAsync(
  expoDir: string,
  reactNativeUnimodulesVersion: string,
  sdkVersion: string
): Promise<void> {
  process.env.EXPO_STAGING = '1';
  Config.api.host = 'staging.exp.host';
  let versions = await Versions.versionsAsync();
  if (!versions.sdkVersions[sdkVersion]) {
    throw new Error(`SDK version ${sdkVersion} not found in versions JSON`);
  }

  if (!versions.sdkVersions[sdkVersion].packagesToInstallWhenEjecting) {
    versions.sdkVersions[sdkVersion].packagesToInstallWhenEjecting = {};
  }

  versions.sdkVersions[sdkVersion].packagesToInstallWhenEjecting![
    'react-native-unimodules'
  ] = reactNativeUnimodulesVersion;

  await Versions.setVersionsAsync(versions);
}

export async function updateExpoKitAndroidAsync(
  expoDir: string,
  appVersion: string,
  sdkVersion: string,
  expokitVersion: string,
  expokitTag: string = 'latest'
) {
  const key = `android-v${appVersion.trim().replace(/^v/, '')}-sdk${sdkVersion}-${uuid()}.tar.gz`;
  const androidDir = path.join(expoDir, 'android');

  // Populate android template files now since we take out the prebuild step later on
  await spawnAsync('et', ['android-generate-dynamic-macros'], {
    stdio: 'inherit',
    cwd: path.resolve(expoDir),
  });

  await S3.uploadDirectoriesAsync(BUCKET, key, [
    {
      source: path.join(androidDir, 'app'),
      destination: 'app',
    },
    {
      isFile: true,
      source: path.join(androidDir, 'build.gradle'),
      destination: 'build.gradle',
    },
    {
      source: path.join(androidDir, 'gradle'),
      destination: 'gradle',
    },
    {
      isFile: true,
      source: path.join(androidDir, 'gradle.properties'),
      destination: 'gradle.properties',
    },
    {
      isFile: true,
      source: path.join(androidDir, 'gradlew'),
      destination: 'gradlew',
    },
    {
      isFile: true,
      source: path.join(androidDir, 'settings.gradle'),
      destination: 'settings.gradle',
    },
    {
      isFile: true,
      source: path.join(androidDir, 'debug.keystore'),
      destination: 'debug.keystore',
    },

    // Manually add template files from android-paths.json. uploadDirectoriesAsync will exclude all
    // files not added to git so we need to include these manually
    {
      isFile: true,
      source: path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml'),
      destination: path.join('app', 'src', 'main', 'AndroidManifest.xml'),
    },
    {
      isFile: true,
      source: path.join(androidDir, 'app', 'google-services.json'),
      destination: path.join('app', 'google-services.json'),
    },
    {
      isFile: true,
      source: path.join(androidDir, 'app', 'fabric.properties'),
      destination: path.join('app', 'fabric.properties'),
    },
  ]);

  process.env.EXPO_STAGING = '1';
  Config.api.host = 'staging.exp.host';
  let versions = await Versions.versionsAsync();
  if (!versions.sdkVersions[sdkVersion]) {
    throw new Error(`SDK version ${sdkVersion} not found in versions JSON`);
  }

  const expokitNpmPackageDir = path.join(expoDir, `expokit-npm-package`);
  const npmVersionArg = expokitVersion || 'patch';

  await spawnAsync(`npm`, ['version', npmVersionArg, '--allow-same-version'], {
    stdio: 'inherit',
    cwd: expokitNpmPackageDir,
  });

  let expokitPackageJson = new JsonFile(path.join(expokitNpmPackageDir, 'package.json'));
  let expokitNpmVersion = await expokitPackageJson.getAsync('version', null);

  versions.sdkVersions[sdkVersion].androidExpoViewUrl = `https://s3.amazonaws.com/${BUCKET}/${key}`;
  versions.sdkVersions[sdkVersion].expokitNpmPackage = `expokit@${expokitNpmVersion}`;
  await Versions.setVersionsAsync(versions);

  try {
    await spawnAsync('npm', ['publish', '--tag', expokitTag], {
      stdio: 'inherit',
      cwd: expokitNpmPackageDir,
    });
  } catch (e) {
    console.error(
      `'npm publish' failed. Please make sure you have permission to publish the 'expokit' package and run 'npm publish' in 'expokit-npm-package'. You do not need to re-run this command after publishing the npm package.`
    );
  }
}
