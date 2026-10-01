import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import semver from 'semver';

import { EXPO_DIR } from '../Constants';
import logger from '../Logger';
import {
  diffNativeModules,
  getNativeModulesAsync,
  NativeModuleChange,
  NativeModulesEnv,
  putNativeModulesAsync,
  readBundledNativeModulesAsync,
} from '../changesets/NativeModules';

type ActionOptions = {
  env: string;
};

const EXPO_PACKAGE_PATH = path.join(EXPO_DIR, 'packages/expo');

async function main(options: ActionOptions) {
  logger.info('\nSyncing bundledNativeModules.json with www...');

  const env = resolveEnv(options);
  await confirmEnvAsync(env);
  const secret = await resolveSecretAsync();

  const sdkVersion = await resolveTargetSdkVersionAsync();
  const bundledNativeModules = await readBundledNativeModulesAsync();

  const currentBundledNativeModules = await getNativeModulesAsync(env, sdkVersion);
  await compareAndConfirmAsync(
    diffNativeModules(currentBundledNativeModules, bundledNativeModules)
  );

  await putNativeModulesAsync(env, sdkVersion, bundledNativeModules, secret);
  logger.success(`Successfully synced the modules for SDK ${sdkVersion}!`);
}

function resolveEnv({ env }: ActionOptions): NativeModulesEnv {
  if (env === 'staging' || env === 'production' || env === 'local') {
    return env;
  } else {
    throw new Error(`Unknown env name: ${env}`);
  }
}

async function confirmEnvAsync(env: NativeModulesEnv): Promise<void> {
  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Are you sure to run this script against the ${chalk.green(env)} environment?`,
      default: true,
    },
  ]);
  if (!confirmed) {
    logger.info('No worries, come back soon!');
    process.exit(1);
  }
}

async function resolveSecretAsync(): Promise<string> {
  if (process.env.EXPO_SDK_NATIVE_MODULES_SECRET) {
    return process.env.EXPO_SDK_NATIVE_MODULES_SECRET;
  }

  logger.info(
    `We need the secret to authenticate you with Expo servers.\nPlease set the ${chalk.green(
      'EXPO_SDK_NATIVE_MODULES_SECRET'
    )} env var if you want to skip the prompt in the future.`
  );

  const { secret } = await inquirer.prompt<{ secret: string }>([
    {
      type: 'password',
      name: 'secret',
      message: 'Secret:',
      validate: (val) => (val ? true : 'The secret cannot be empty'),
    },
  ]);
  return secret;
}

async function resolveTargetSdkVersionAsync(): Promise<string> {
  const expoPackageJsonPath = path.join(EXPO_PACKAGE_PATH, 'package.json');
  const contents = await JsonFile.readAsync<Record<string, string>>(expoPackageJsonPath);
  const majorVersion = semver.major(contents.version);

  const sdkVersion = `${majorVersion}.0.0`;

  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Do you want to sync bundledNativeModules.json for ${chalk.green(
        `SDK ${sdkVersion}`
      )}?`,
      default: true,
    },
  ]);

  if (!confirmed) {
    logger.info('No worries, come back soon!');
    process.exit(1);
  } else {
    return sdkVersion;
  }
}

async function compareAndConfirmAsync(changes: NativeModuleChange[]): Promise<void> {
  logger.info('Changes:');
  for (const { npmPackage, from, to } of changes) {
    logger.info(
      ` - ${npmPackage}: ${chalk.red(from ?? '(none)')} -> ${chalk.green(to ?? '(removed)')}`
    );
  }
  if (!changes.length) {
    logger.info(chalk.gray('(no changes found)'));
    // there's no need to proceed with the script
    process.exit(0);
  }

  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Are you sure to make these changes?`,
      default: true,
    },
  ]);
  if (!confirmed) {
    logger.info('No worries, come back soon!');
    process.exit(1);
  }
}

export default (program: Command) => {
  program
    .command('sync-bundled-native-modules')
    .description(
      'Sync configuration from bundledNativeModules.json to the corresponding API endpoint.'
    )
    .alias('sbnm')
    .option('-e, --env <local|staging|production>', 'www environment', 'staging')
    .asyncAction(main);
};
