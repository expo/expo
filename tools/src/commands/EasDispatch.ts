import { Command } from '@expo/commander';
import plist from '@expo/plist';
import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
import fs, { mkdirp } from 'fs-extra';
import { glob } from 'glob';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import semver from 'semver';
import * as tar from 'tar';
import { v4 as uuidv4 } from 'uuid';

import {
  EAS_EXPO_GO_PROJECT_DIR,
  EXPO_GO_IOS_DIR,
  REPO_OWNER,
  RELEASES_REPO_NAME,
} from '../Constants';
import Git from '../Git';
import { getOrCreateReleaseAsync, uploadReleaseAssetAsync } from '../GitHub';
import logger from '../Logger';
import { androidAppVersionAsync, iosAppVersionAsync } from '../ProjectVersions';
import { modifySdkVersionsAsync, modifyVersionsAsync } from '../Versions';

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
  'android-client-build-and-submit': {
    name: 'Build a new Android client and submit it to the Play Store.',
    actionId: 'android-client-build-and-submit',
    action: androidBuildAndSubmitAsync,
  },
  'ios-simulator-build': {
    name: '[internal] Build a new iOS Client simulator on EAS',
    actionId: 'ios-simulator-build',
    action: iosSimulatorBuildAsync,
  },
  'ios-simulator-upload': {
    name: '[internal] Upload a new iOS Client simulator to expo/expo-go-releases repo and updates www endpoint',
    actionId: 'ios-simulator-upload',
    action: iosSimulatorUploadAsync,
  },
  'android-apk-build': {
    name: '[internal] Build a new Android Client APK on EAS',
    actionId: 'android-apk-build',
    action: androidApkBuildAsync,
  },
  'android-apk-upload': {
    name: '[internal] Upload a new Android Client APK to expo/expo-go-releases repo and updates www endpoint',
    actionId: 'android-apk-upload',
    action: androidApkUploadAsync,
  },
  'remove-background-permissions-from-info-plist': {
    name: '[internal] Removes permissions for background features that should be disabled in the App Store.',
    actionId: 'remove-background-permissions-from-info-plist',
    action: internalRemoveBackgroundPermissionsFromInfoPlistAsync,
    internal: true,
  },
  'verify-versions-endpoint-available': {
    name: '[internal] Verify that the versions endpoint is available',
    actionId: 'verify-versions-endpoint-available',
    action: verifyVersionsEndpointAvailableAsync,
    internal: true,
  },
};

export async function verifyVersionsEndpointAvailableAsync() {
  logger.debug('Verifying versions endpoint is available');
  const sentinelSdkVersion = 'x.x.x';

  // Set some sentinel value
  await modifySdkVersionsAsync(sentinelSdkVersion, (sdkVersions) => {
    (sdkVersions as any).sentinel = new Date().toISOString();
    return sdkVersions;
  });

  logger.debug('Sentinel value set');

  // Remove the sentinel value
  await modifyVersionsAsync((versions) => {
    delete versions.sdkVersions[sentinelSdkVersion];
    return versions;
  });

  logger.debug('Sentinel value removed');

  logger.debug('Versions endpoint is available');
}

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

function getAppName(appVersion: string): string {
  return `Expo-Go-${appVersion}`;
}

function getAndroidApkUrl(appVersion: string): string {
  return `https://github.com/${REPO_OWNER}/${RELEASES_REPO_NAME}/releases/download/${getAppName(appVersion)}/${getAppName(appVersion)}.apk`;
}

function getIosSimulatorUrl(appVersion: string): string {
  return `https://github.com/${REPO_OWNER}/${RELEASES_REPO_NAME}/releases/download/${getAppName(appVersion)}/${getAppName(appVersion)}.tar.gz`;
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
        message: `${appVersion} version of a client was already uploaded to GitHub. Do you want to override it?`,
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
  const projectDir = EAS_EXPO_GO_PROJECT_DIR;
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
    let opensslVersionCommandOutput = '';

    // Handle different openssl versions
    try {
      const { stdout } = await spawnAsync('openssl', ['--version'], {
        stdio: isDebug ? 'inherit' : 'pipe',
      });
      opensslVersionCommandOutput = stdout.toString();
    } catch (err) {
      console.log(`'openssl --version' failed, trying 'openssl version'. ${err}`);
      const { stdout } = await spawnAsync('openssl', ['version'], {
        stdio: isDebug ? 'inherit' : 'pipe',
      });
      opensslVersionCommandOutput = stdout.toString();
    }

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
  const projectDir = EAS_EXPO_GO_PROJECT_DIR;
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
    `Removing location, audio, background-fetch, background-task and remote-notfication from UIBackgroundModes from ios/Exponent/Supporting/Info.plist`
  );
  parsedPlist.UIBackgroundModes = parsedPlist.UIBackgroundModes.filter(
    (i: string) => !['location', 'audio', 'remote-notification', 'fetch', 'processing'].includes(i)
  );
  logger.info(
    'Removing BGTaskSchedulerPermittedIdentifiers key from ios/Exponent/Supporting/Info.plist'
  );
  delete parsedPlist.BGTaskSchedulerPermittedIdentifiers;

  await fs.writeFile(INFO_PLIST_PATH, plist.build(parsedPlist));
}

async function androidApkBuildAsync() {
  const projectDir = EAS_EXPO_GO_PROJECT_DIR;
  await enforceRunningOnSdkReleaseBranchAsync();
  await prepareAndroidCredentialsAsync(projectDir);

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

async function androidApkUploadAsync() {
  if (!process.env.GITHUB_TOKEN) {
    logger.error('GITHUB_TOKEN is not set. Please set it in your environment.');
    return;
  }

  const sdkVersion = await enforceRunningOnSdkReleaseBranchAsync();
  const appVersion = await androidAppVersionAsync();
  await confirmPromptIfOverridingRemoteFileAsync(getAndroidApkUrl(appVersion), appVersion);
  const projectDir = EAS_EXPO_GO_PROJECT_DIR;
  const archivePath = await downloadBuildArtifactAsync(
    projectDir,
    'android',
    appVersion,
    sdkVersion
  );

  logger.info(`Build archive downloaded to: ${archivePath}`);

  const repoOwner = REPO_OWNER;
  const repoName = RELEASES_REPO_NAME;

  const releaseTag = getAppName(appVersion);

  try {
    const release = await getOrCreateReleaseAsync(
      repoOwner,
      repoName,
      releaseTag,
      appVersion,
      sdkVersion
    );

    logger.info(`Release on GitHub: ${release.data.html_url}`);

    const artifactName = path.basename(archivePath);
    const fileStats = fs.statSync(archivePath);
    const totalBytes = fileStats.size;

    const spinner = ora(
      `Uploading to GitHub: ${artifactName} (${(totalBytes / 1024 / 1024).toFixed(1)} MB)...`
    ).start();

    try {
      const artifactContent = await fs.readFile(archivePath);

      const res = await uploadReleaseAssetAsync(
        repoOwner,
        repoName,
        release.data.id,
        artifactName,
        artifactContent
      );

      const githubArtifactUrl = res.data.browser_download_url;
      spinner.succeed(`Upload completed successfully! ${githubArtifactUrl}`);
      await modifySdkVersionsAsync(sdkVersion, (sdkVersions) => {
        sdkVersions.androidClientUrl = githubArtifactUrl;
        sdkVersions.androidClientVersion = appVersion;
        return sdkVersions;
      });
    } catch (error) {
      spinner.fail('Upload failed!');
      throw error;
    }
  } catch (error: any) {
    logger.error(`Error creating release: ${error.message}`);
    throw error;
  } finally {
    await fs.unlink(archivePath);
  }
}

async function iosSimulatorUploadAsync() {
  if (!process.env.GITHUB_TOKEN) {
    logger.error('GITHUB_TOKEN is not set. Please set it in your environment.');
    return;
  }

  const appVersion = await iosAppVersionAsync();
  const sdkVersion = await enforceRunningOnSdkReleaseBranchAsync();
  await confirmPromptIfOverridingRemoteFileAsync(getIosSimulatorUrl(appVersion), appVersion);
  const projectDir = EAS_EXPO_GO_PROJECT_DIR;
  const tempArchivePath = await downloadBuildArtifactAsync(
    projectDir,
    'ios',
    appVersion,
    sdkVersion
  );
  const archivePath = await processIosTarArchiveAsync(tempArchivePath, projectDir);

  const repoOwner = REPO_OWNER;
  const repoName = RELEASES_REPO_NAME;

  const releaseTag = getAppName(appVersion);

  try {
    const release = await getOrCreateReleaseAsync(
      repoOwner,
      repoName,
      releaseTag,
      appVersion,
      sdkVersion
    );

    logger.info(`Release on GitHub: ${release.data.html_url}`);

    const artifactName = path.basename(archivePath);
    const fileStats = fs.statSync(archivePath);
    const totalBytes = fileStats.size;

    const spinner = ora(
      `Uploading to GitHub: ${artifactName} (${(totalBytes / 1024 / 1024).toFixed(1)} MB)...`
    ).start();

    try {
      const artifactContent = await fs.readFile(archivePath);

      const res = await uploadReleaseAssetAsync(
        repoOwner,
        repoName,
        release.data.id,
        artifactName,
        artifactContent
      );

      const githubArtifactUrl = res.data.browser_download_url;
      spinner.succeed(`Upload completed successfully! ${githubArtifactUrl}`);
      await modifySdkVersionsAsync(sdkVersion, (sdkVersions) => {
        sdkVersions.iosClientUrl = githubArtifactUrl;
        sdkVersions.iosClientVersion = appVersion;
        return sdkVersions;
      });
    } catch (error) {
      spinner.fail('Upload failed!');
      throw error;
    }
  } catch (error: any) {
    logger.error(`Error creating release: ${error.message}`);
    throw error;
  } finally {
    await fs.unlink(archivePath);
  }
}

export async function iosSimulatorBuildAsync() {
  const projectDir = EAS_EXPO_GO_PROJECT_DIR;
  await enforceRunningOnSdkReleaseBranchAsync();

  await spawnAsync(
    'eas',
    ['build', '--platform', 'ios', '--profile', PUBLISH_CLIENT_BUILD_PROFILE],
    {
      cwd: projectDir,
      stdio: 'inherit',
    }
  );
}

async function downloadBuildArtifactAsync(
  projectDir: string,
  platform: 'ios' | 'android',
  appVersion: string,
  sdkVersion: string
) {
  const buildInfo = await spawnAsync(
    'eas',
    [
      'build:list',
      '--platform',
      platform,
      '--limit',
      '3',
      '--json',
      '--non-interactive',
      '--status',
      'finished',
      '--profile',
      PUBLISH_CLIENT_BUILD_PROFILE,
      '--sdk-version',
      sdkVersion,
    ],
    {
      cwd: projectDir,
      stdio: 'pipe',
      env: {
        ...process.env,
        EAS_BUILD_PROFILE: PUBLISH_CLIENT_BUILD_PROFILE,
      },
    }
  );

  const builds = JSON.parse(buildInfo.stdout.toString());

  if (!builds || builds.length === 0) {
    throw new Error(`No builds found. Make sure you have run ${platform}-build first.`);
  }

  const buildChoices = builds.map((build: any, index: number) => {
    const createdAt = build.createdAt
      ? new Date(build.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : 'Unknown date';

    return {
      name: `Build ${index + 1}: ${build.platform} - ${build.status} - ${createdAt} - ${build.id}`,
      value: build,
    };
  });

  buildChoices.push({
    name: 'Enter custom build artifact URL',
    value: 'custom',
  });

  const { selectedBuild } = await inquirer.prompt<{ selectedBuild: any }>([
    {
      type: 'list',
      name: 'selectedBuild',
      message: 'Select a build to download or enter a custom URL:',
      choices: buildChoices,
    },
  ]);

  let buildUrl: string;

  if (selectedBuild === 'custom') {
    const { customUrl } = await inquirer.prompt<{ customUrl: string }>([
      {
        type: 'input',
        name: 'customUrl',
        message: 'Enter the build artifact URL:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'URL cannot be empty';
          }
          if (!input.startsWith('http')) {
            return 'URL must start with http:// or https://';
          }
          if (platform === 'android' && !input.endsWith('.apk')) {
            return 'URL must end with .apk';
          } else if (platform === 'ios' && !input.endsWith('.tar.gz')) {
            return 'URL must end with .tar.gz';
          }
          return true;
        },
      },
    ]);
    buildUrl = customUrl;
  } else {
    if (!selectedBuild.artifacts?.buildUrl) {
      throw new Error('Selected build does not have a build URL available');
    }
    buildUrl = selectedBuild.artifacts.buildUrl;
  }

  const archivePath = path.join(
    projectDir,
    `${getAppName(appVersion)}.${platform === 'android' ? 'apk' : 'tar.gz'}`
  );

  logger.info(`Downloading build from: ${buildUrl}`);
  await spawnAsync('curl', ['-L', '-o', archivePath, buildUrl], {
    cwd: projectDir,
    stdio: 'inherit',
  });

  return archivePath;
}

// Downloaded tar.gz could be of two formats:
// tar.gz/Expo go.app/[App Contents] or tar.gz/[App Contents]
async function processIosTarArchiveAsync(archivePath: string, projectDir: string): Promise<string> {
  const tempExtractDir = path.join(projectDir, 'temp-extract');
  try {
    await mkdirp(tempExtractDir);
    await tar.extract({
      file: archivePath,
      cwd: tempExtractDir,
    });

    // delete the original archive and create a new later in the same path
    fs.removeSync(archivePath);

    const extractedContents = await fs.readdir(tempExtractDir);
    // if there is a .app bundle, the file is downloaded from EAS, create the tar file from it's contents
    const appBundle = extractedContents.find((item) => item.endsWith('.app'));
    if (appBundle) {
      const appBundlePath = path.join(tempExtractDir, appBundle);
      await tar.create(
        {
          gzip: true,
          file: archivePath,
          cwd: appBundlePath,
        },
        ['.']
      );
      logger.info(`Created tar from .app bundle contents: ${archivePath}`);
    }
    // If no .app file, check if it's a valid iOS app bundle. tar.gz could be from Cloudfront URL.
    else if (fs.existsSync(path.join(tempExtractDir, 'Info.plist'))) {
      await tar.create(
        {
          gzip: true,
          file: archivePath,
          cwd: tempExtractDir,
        },
        ['.']
      );
      logger.info(`Created tar from extracted contents: ${archivePath}`);
    } else {
      throw new Error('Unknown archive format');
    }

    return archivePath;
  } finally {
    await fs.remove(tempExtractDir);
  }
}
