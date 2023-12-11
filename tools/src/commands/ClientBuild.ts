import { S3 } from '@aws-sdk/client-s3';
import { Command } from '@expo/commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';

import { EXPO_DIR } from '../Constants';
import { link } from '../Formatter';
import Git from '../Git';
import logger from '../Logger';
import { getNewestSDKVersionAsync } from '../ProjectVersions';
import { modifySdkVersionsAsync, getSdkVersionsAsync } from '../Versions';
import AndroidClientBuilder from '../client-build/AndroidClientBuilder';
import IosClientBuilder from '../client-build/IosClientBuilder';
import { ClientBuilder, ClientBuildFlavor, Platform } from '../client-build/types';
import askForPlatformAsync from '../utils/askForPlatformAsync';
import askForSdkVersionAsync from '../utils/askForSDKVersionAsync';

const s3Client = new S3({ region: 'us-east-1' });
const { yellow, blue, magenta } = chalk;

type ActionOptions = {
  platform?: Platform;
  release: boolean;
  flavor: ClientBuildFlavor;
};

const flavors = ['versioned', 'unversioned'];

export default (program: Command) => {
  program
    .command('client-build')
    .alias('cb')
    .description(
      'Builds Expo client for iOS simulator or APK for Android, uploads the archive to S3 and saves its url to versions endpoint.'
    )
    .option('-p, --platform [string]', 'Platform for which the client will be built.')
    .option(
      '-r, --release',
      'Whether to upload and release the client build to staging versions endpoint.',
      false
    )
    .option(
      '-f, --flavor [string]',
      `Which build flavor to use. Possible values: ${flavors}`,
      flavors[0]
    )
    .asyncAction(main);
};

async function main(options: ActionOptions) {
  const platform = options.platform || (await askForPlatformAsync());
  const sdkBranchVersion = await Git.getSDKVersionFromBranchNameAsync();

  if (options.release && !sdkBranchVersion) {
    throw new Error(`Client builds can be released only from the release branch!`);
  }
  if (!Object.values(ClientBuildFlavor).includes(options.flavor)) {
    throw new Error(`Flavor "${options.flavor}" is not valid, use one of: ${flavors}`);
  }

  const builder = getBuilderForPlatform(platform);
  const sdkVersion =
    sdkBranchVersion ||
    (await askForSdkVersionAsync(platform, await getNewestSDKVersionAsync(platform)));
  const appVersion = await builder.getAppVersionAsync();

  await buildOrUseCacheAsync(builder, options.flavor);

  if (sdkVersion && options.release) {
    await uploadAsync(builder, sdkVersion, appVersion);
    await releaseAsync(builder, sdkVersion, appVersion);
  }
}

function getBuilderForPlatform(platform: Platform): ClientBuilder {
  switch (platform) {
    case 'ios':
      return new IosClientBuilder();
    case 'android':
      return new AndroidClientBuilder();
    default: {
      throw new Error(`Platform "${platform}" is not supported yet!`);
    }
  }
}

async function askToRecreateSimulatorBuildAsync(): Promise<boolean> {
  if (process.env.CI) {
    return false;
  }
  const { createNew } = await inquirer.prompt<{ createNew: boolean }>([
    {
      type: 'confirm',
      name: 'createNew',
      message: 'Do you want to create a fresh one?',
      default: true,
    },
  ]);
  return createNew;
}

async function askToOverrideBuildAsync(): Promise<boolean> {
  if (process.env.CI) {
    // we should never override anything in CI, too easy to accidentally mess something up in prod
    return false;
  }
  const { override } = await inquirer.prompt<{ override: boolean }>([
    {
      type: 'confirm',
      name: 'override',
      message: 'Do you want to override it?',
      default: true,
    },
  ]);
  return override;
}

async function buildOrUseCacheAsync(
  builder: ClientBuilder,
  flavor: ClientBuildFlavor
): Promise<void> {
  const appPath = builder.getAppPath();

  // Build directory already exists, we could reuse that one — especially useful on the CI.
  if (await fs.pathExists(appPath)) {
    const relativeAppPath = path.relative(EXPO_DIR, appPath);
    logger.info(`Client build already exists at ${magenta.bold(relativeAppPath)}`);

    if (!(await askToRecreateSimulatorBuildAsync())) {
      logger.info('Skipped building the app, using cached build instead...');
      return;
    }
  }
  await builder.buildAsync(flavor);
}

async function uploadAsync(
  builder: ClientBuilder,
  sdkVersion: string,
  appVersion: string
): Promise<void> {
  const sdkVersions = await getSdkVersionsAsync(sdkVersion);

  // Target app url already defined in versions endpoint.
  // We make this check to reduce the risk of unintentional overrides.
  if (sdkVersions?.[`${builder.platform}ClientUrl`] === builder.getClientUrl(appVersion)) {
    logger.info(`Build ${yellow.bold(appVersion)} is already defined in versions endpoint.`);
    logger.info('The new build would be uploaded onto the same URL.');

    if (!(await askToOverrideBuildAsync())) {
      logger.warn('Refused overriding the build, exiting the proces...');
      process.exit(0);
      return;
    }
  }
  logger.info(`Uploading ${yellow.bold(appVersion)} build`);

  await builder.uploadBuildAsync(s3Client, appVersion);
}

async function releaseAsync(
  builder: ClientBuilder,
  sdkVersion: string,
  appVersion: string
): Promise<void> {
  const clientUrl = builder.getClientUrl(appVersion);

  logger.info(
    `Updating versions endpoint with client url ${blue.bold(link(clientUrl, clientUrl))}`
  );

  await updateClientUrlAndVersionAsync(builder, sdkVersion, appVersion);
}

async function updateClientUrlAndVersionAsync(
  builder: ClientBuilder,
  sdkVersion: string,
  appVersion: string
) {
  await modifySdkVersionsAsync(sdkVersion, (sdkVersions) => {
    sdkVersions[`${builder.platform}ClientUrl`] = builder.getClientUrl(appVersion);
    sdkVersions[`${builder.platform}ClientVersion`] = appVersion;
    return sdkVersions;
  });
}
