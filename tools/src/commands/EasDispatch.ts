import { S3 } from '@aws-sdk/client-s3';
import { Command } from '@expo/commander';
import plist from '@expo/plist';
import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
import fs, { mkdirp } from 'fs-extra';
import { glob } from 'glob';
import inquirer from 'inquirer';
import fetch from 'node-fetch';
import os from 'os';
import path from 'path';
import semver from 'semver';
import { v4 as uuidv4 } from 'uuid';

import { EXPO_DIR, EXPO_GO_IOS_DIR } from '../Constants';
import Git from '../Git';
import logger from '../Logger';
import { androidAppVersionAsync, iosAppVersionAsync } from '../ProjectVersions';
import { modifySdkVersionsAsync } from '../Versions';

const s3Client = new S3({ region: 'us-east-1' });

const RELEASE_BUILD_PROFILE = 'release-client';
const PUBLISH_CLIENT_BUILD_PROFILE = 'publish-client';

type Action = {
  name: string;
  actionId: string;
  internal?: boolean;
  action: () => Promise<void>;
};

const CUSTOM_ACTIONS: Record<string, Action> = {
  'ios-client-build-and-submit': {
    name: 'Build a new iOS client and submit it to the App Store.',
    actionId: 'ios-client-build-and-submit',
    action: iosBuildAndSubmitAsync,
  },
  'ios-simulator-client-build-and-publish': {
    name: 'Build a new iOS Client simulator and publish it to S3',
    actionId: 'ios-simulator-client-build-and-publish',
    action: iosSimulatorBuildAndPublishAsync,
  },
  'android-client-build-and-submit': {
    name: 'Build a new Android client and submit it to the Play Store.',
    actionId: 'android-client-build-and-submit',
    action: androidBuildAndSubmitAsync,
  },
  'android-apk-build-and-publish': {
    name: 'Build a new Android client APK and publish it to S3',
    actionId: 'android-apk-build-and-publish',
    action: androidAPKBuildAndPublishAsync,
  },
  'remove-background-permissions-from-info-plist': {
    name: '[internal] Removes permissions for background features that should be disabled in the App Store.',
    actionId: 'remove-background-permissions-from-info-plist',
    action: internalRemoveBackgroundPermissionsFromInfoPlistAsync,
    internal: true,
  },
  'ios-simulator-publish': {
    name: '[internal] Upload simulator builds to S3 and update www endpoint',
    actionId: 'ios-simulator-publish',
    action: internalIosSimulatorPublishAsync,
    internal: true,
  },
  'android-apk-publish': {
    name: '[internal] Upload Android client to S3 and update www endpoint',
    actionId: 'android-apk-publish',
    action: internalAndroidAPKPublishAsync,
    internal: true,
  },
};

export default (program: Command) => {
  program
    .command('eas-dispatch [action]')
    .alias('eas')
    .description(`Runs predefined EAS Build & Submit jobs.`)
    .asyncAction(main);
};

async function main(actionId: string | undefined) {
  if (!actionId || !CUSTOM_ACTIONS[actionId]) {
    const actions = Object.values(CUSTOM_ACTIONS)
      .filter((i) => !i.internal)
      .map((i) => `\n- ${i.actionId} - ${i.name}`);
    if (!actionId) {
      logger.error(`You need to provide action name. Select one of: ${actions.join('')}`);
    } else {
      logger.error(`Unknown action ${actionId}. Select one of: ${actions.join('')}`);
    }
    return;
  }

  CUSTOM_ACTIONS[actionId].action();
}

function getAndroidApkUrl(appVersion: string): string {
  return `https://d1ahtucjixef4r.cloudfront.net/Exponent-${appVersion}.apk`;
}

function getIosSimulatorUrl(appVersion: string): string {
  return `https://dpq5q02fu5f55.cloudfront.net/Exponent-${appVersion}.tar.gz`;
}

async function confirmPromptIfOverridingRemoteFileAsync(
  url: string,
  appVersion: string
): Promise<void> {
  const response = await fetch(url, {
    method: 'HEAD',
  });
  if (response.status < 400) {
    const { selection } = await inquirer.prompt<{ selection: boolean }>([
      {
        type: 'confirm',
        name: 'selection',
        default: false,
        message: `${appVersion} version of a client was already uploaded to S3. Do you want to override it?`,
      },
    ]);
    if (!selection) {
      throw new Error('ABORTING');
    }
  }
}

async function enforceRunningOnSdkReleaseBranchAsync(): Promise<string> {
  const sdkBranchVersion = await Git.getSDKVersionFromBranchNameAsync();
  if (!sdkBranchVersion) {
    logger.error(`Client builds can be released only from the release branch!`);
    throw new Error('ABORTING');
  }
  return sdkBranchVersion;
}

async function iosBuildAndSubmitAsync() {
  await enforceRunningOnSdkReleaseBranchAsync();
  const isDebug = !!process.env.EXPO_DEBUG;
  const projectDir = path.join(EXPO_DIR, 'apps/eas-expo-go');
  const credentialsDir = path.join(projectDir, 'credentials');
  const fastlaneMatchBucketCopyPath = path.join(credentialsDir, 'fastlane-match');
  const releaseSecretsPath = path.join(credentialsDir, 'secrets');

  logger.info('Preparing credentials');
  try {
    await mkdirp(fastlaneMatchBucketCopyPath);
    await mkdirp(releaseSecretsPath);
    await spawnAsync(
      'gsutil',
      ['rsync', '-r', '-d', 'gs://expo-client-certificates', fastlaneMatchBucketCopyPath],
      { stdio: isDebug ? 'inherit' : 'pipe' }
    );
    await spawnAsync(
      'gsutil',
      ['rsync', '-r', '-d', 'gs://expo-go-release-secrets', releaseSecretsPath],
      { stdio: isDebug ? 'inherit' : 'pipe' }
    );

    const privateKeyMatches = glob.sync('*/certs/distribution/*.p12', {
      absolute: true,
      cwd: fastlaneMatchBucketCopyPath,
    });
    assert(privateKeyMatches.length === 1);
    const privateKeyPath = privateKeyMatches[0];

    const certDERMatches = glob.sync('*/certs/distribution/*.cer', {
      absolute: true,
      cwd: fastlaneMatchBucketCopyPath,
    });
    assert(certDERMatches.length === 1);
    const certDERPath = certDERMatches[0];

    const certPEMPath = path.join(credentialsDir, 'cert.pem');
    const p12KeystorePath = path.join(credentialsDir, 'dist.p12');
    const p12KeystorePassword = uuidv4();

    await spawnAsync(
      'openssl',
      ['x509', '-inform', 'der', '-in', certDERPath, '-out', certPEMPath],
      {
        stdio: isDebug ? 'inherit' : 'pipe',
      }
    );
    const { stdout: opensslVersionCommandOutput } = await spawnAsync('openssl', ['--version'], {
      stdio: isDebug ? 'inherit' : 'pipe',
    });
    const opensslVersionRegex = /OpenSSL\s(\d+\.\d+\.\d+)/;
    const matches = opensslVersionCommandOutput.match(opensslVersionRegex);
    assert(matches, 'Could not parse openssl version');
    const opensslVersion = matches[1];
    const isOpensslVersionAbove1 = semver.satisfies(opensslVersion, '>1');
    await spawnAsync(
      'openssl',
      [
        'pkcs12',
        '-export',
        ...(isOpensslVersionAbove1 ? ['-legacy'] : []),
        '-out',
        p12KeystorePath,
        '-inkey',
        privateKeyPath,
        '-in',
        certPEMPath,
        '-password',
        `pass:${p12KeystorePassword}`,
      ],
      { stdio: isDebug ? 'inherit' : 'pipe' }
    );

    await fs.writeFile(
      path.join(projectDir, 'credentials.json'),
      JSON.stringify({
        ios: {
          'Expo Go': {
            provisioningProfilePath: path.join(
              fastlaneMatchBucketCopyPath,
              'C8D8QTF339/profiles/appstore/AppStore_host.exp.Exponent.mobileprovision'
            ),
            distributionCertificate: {
              path: p12KeystorePath,
              password: p12KeystorePassword,
            },
          },
          ExpoNotificationServiceExtension: {
            provisioningProfilePath: path.join(
              fastlaneMatchBucketCopyPath,
              'C8D8QTF339/profiles/appstore/AppStore_host.exp.Exponent.ExpoNotificationServiceExtension.mobileprovision'
            ),
            distributionCertificate: {
              path: p12KeystorePath,
              password: p12KeystorePassword,
            },
          },
        },
      })
    );
  } catch (err) {
    if (!isDebug) {
      logger.error(
        'There was an error when preparing build credentials. Run with EXPO_DEBUG=1 env to see more details.'
      );
    }
    throw err;
  }

  await spawnAsync(
    'eas',
    ['build', '--platform', 'ios', '--profile', RELEASE_BUILD_PROFILE, '--auto-submit'],
    {
      cwd: projectDir,
      stdio: 'inherit',
    }
  );
}

async function iosSimulatorBuildAndPublishAsync() {
  const projectDir = path.join(EXPO_DIR, 'apps/eas-expo-go');
  await enforceRunningOnSdkReleaseBranchAsync();

  const appVersion = await iosAppVersionAsync();
  await confirmPromptIfOverridingRemoteFileAsync(getIosSimulatorUrl(appVersion), appVersion);

  await spawnAsync(
    'eas',
    ['build', '--platform', 'ios', '--profile', PUBLISH_CLIENT_BUILD_PROFILE],
    {
      cwd: projectDir,
      stdio: 'inherit',
    }
  );
}

async function prepareAndroidCredentialsAsync(projectDir: string): Promise<void> {
  const isDebug = !!process.env.EXPO_DEBUG;
  const credentialsDir = path.join(projectDir, 'credentials');
  const releaseSecretsPath = path.join(credentialsDir, 'secrets');
  await mkdirp(releaseSecretsPath);
  const keystorePath = path.join(releaseSecretsPath, 'android-keystore.jks');
  const keystorePasswordPath = path.join(releaseSecretsPath, 'android-keystore.password');
  const keystoreAliasPasswordPath = path.join(
    releaseSecretsPath,
    'android-keystore-alias.password'
  );

  logger.info('Preparing credentials');
  try {
    await spawnAsync(
      'gsutil',
      ['rsync', '-r', '-d', 'gs://expo-go-release-secrets', releaseSecretsPath],
      { stdio: isDebug ? 'inherit' : 'pipe' }
    );

    await fs.writeFile(
      path.join(projectDir, 'credentials.json'),
      JSON.stringify({
        android: {
          keystore: {
            keystorePath,
            keystorePassword: (await fs.readFile(keystorePasswordPath, 'utf-8')).trim(),
            keyAlias: 'ExponentKey',
            keyPassword: (await fs.readFile(keystoreAliasPasswordPath, 'utf-8')).trim(),
          },
        },
      })
    );
  } catch (err) {
    if (!isDebug) {
      logger.error(
        'There was an error when preparing build credentials. Run with EXPO_DEBUG=1 env to see more details.'
      );
    }
    throw err;
  }
}

async function androidBuildAndSubmitAsync() {
  const projectDir = path.join(EXPO_DIR, 'apps/eas-expo-go');
  await enforceRunningOnSdkReleaseBranchAsync();
  await prepareAndroidCredentialsAsync(projectDir);

  await spawnAsync(
    'eas',
    ['build', '--platform', 'android', '--profile', RELEASE_BUILD_PROFILE, '--auto-submit'],
    {
      cwd: projectDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        EAS_DANGEROUS_OVERRIDE_ANDROID_APPLICATION_ID: 'host.exp.exponent',
      },
    }
  );

  logger.info('Updating versionCode in local app/build.gradle with value from EAS servers.');
  await spawnAsync(
    'eas',
    ['build:version:sync', '--platform', 'android', '--profile', RELEASE_BUILD_PROFILE],
    {
      cwd: projectDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        EAS_DANGEROUS_OVERRIDE_ANDROID_APPLICATION_ID: 'host.exp.exponent',
      },
    }
  );
}

async function androidAPKBuildAndPublishAsync() {
  const projectDir = path.join(EXPO_DIR, 'apps/eas-expo-go');
  await enforceRunningOnSdkReleaseBranchAsync();
  await prepareAndroidCredentialsAsync(projectDir);

  const appVersion = await androidAppVersionAsync();
  await confirmPromptIfOverridingRemoteFileAsync(getAndroidApkUrl(appVersion), appVersion);

  await spawnAsync(
    'eas',
    ['build', '--platform', 'android', '--profile', PUBLISH_CLIENT_BUILD_PROFILE],
    {
      cwd: projectDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        EAS_DANGEROUS_OVERRIDE_ANDROID_APPLICATION_ID: 'host.exp.exponent',
      },
    }
  );
}

async function internalRemoveBackgroundPermissionsFromInfoPlistAsync(): Promise<void> {
  const INFO_PLIST_PATH = path.join(EXPO_GO_IOS_DIR, 'Exponent/Supporting/Info.plist');
  const rawPlist = await fs.readFile(INFO_PLIST_PATH, 'utf-8');
  const parsedPlist = plist.parse(rawPlist);

  logger.info(
    `Removing NSLocationAlwaysAndWhenInUseUsageDescription from ios/Exponent/Supporting/Info.plist`
  );
  delete parsedPlist.NSLocationAlwaysAndWhenInUseUsageDescription;
  logger.info(`Removing NSLocationAlwaysUsageDescription from ios/Exponent/Supporting/Info.plist`);
  delete parsedPlist.NSLocationAlwaysUsageDescription;

  logger.info(
    `Removing location, audio and remonte-notfication from UIBackgroundModes from ios/Exponent/Supporting/Info.plist`
  );
  parsedPlist.UIBackgroundModes = parsedPlist.UIBackgroundModes.filter(
    (i: string) => !['location', 'audio', 'remote-notification'].includes(i)
  );
  await fs.writeFile(INFO_PLIST_PATH, plist.build(parsedPlist));
}

async function internalIosSimulatorPublishAsync() {
  const tmpTarGzPath = path.join(os.tmpdir(), 'simulator.tar.gz');
  const projectDir = path.join(EXPO_DIR, 'apps/eas-expo-go');
  const sdkVersion = await enforceRunningOnSdkReleaseBranchAsync();
  const artifactPaths = glob.sync('ios/build/Build/Products/*simulator/*.app', {
    absolute: true,
    cwd: projectDir,
  });

  if (artifactPaths.length !== 1) {
    logger.error(`Expected exactly one .app directory. Found: ${artifactPaths}.`);
  }
  await spawnAsync('tar', ['-zcvf', tmpTarGzPath, '-C', artifactPaths[0], '.'], {
    stdio: ['ignore', 'ignore', 'inherit'], // only stderr
  });
  const appVersion = await iosAppVersionAsync();
  const file = fs.createReadStream(tmpTarGzPath);

  logger.info(`Uploading Exponent-${appVersion}.tar.gz to S3`);
  await s3Client.putObject({
    Bucket: 'exp-ios-simulator-apps',
    Key: `Exponent-${appVersion}.tar.gz`,
    Body: file,
    ACL: 'public-read',
  });

  logger.info('Updating versions endpoint');
  await modifySdkVersionsAsync(sdkVersion, (sdkVersions) => {
    sdkVersions.iosClientUrl = getIosSimulatorUrl(appVersion);
    sdkVersions.iosClientVersion = appVersion;
    return sdkVersions;
  });
}

async function internalAndroidAPKPublishAsync() {
  const projectDir = path.join(EXPO_DIR, 'apps/eas-expo-go');
  const sdkVersion = await enforceRunningOnSdkReleaseBranchAsync();
  const artifactPaths = glob.sync('android/app/build/outputs/**/*.apk', {
    absolute: true,
    cwd: projectDir,
  });

  if (artifactPaths.length !== 1) {
    logger.error(`Expected exactly one .apk file. Found: ${artifactPaths}`);
  }
  const appVersion = await androidAppVersionAsync();
  const file = fs.createReadStream(artifactPaths[0]);

  logger.info(`Uploading Exponent-${appVersion}.apk to S3`);
  await s3Client.putObject({
    Bucket: 'exp-android-apks',
    Key: `Exponent-${appVersion}.apk`,
    Body: file,
    ACL: 'public-read',
  });

  logger.info('Updating versions endpoint');
  await modifySdkVersionsAsync(sdkVersion, (sdkVersions) => {
    sdkVersions.androidClientUrl = getAndroidApkUrl(appVersion);
    sdkVersions.androidClientVersion = appVersion;
    return sdkVersions;
  });
}
