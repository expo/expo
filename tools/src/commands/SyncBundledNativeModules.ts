import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fetch from 'node-fetch';
import path from 'path';
import semver from 'semver';

import { EXPO_DIR, LOCAL_API_HOST, STAGING_API_HOST, PRODUCTION_API_HOST } from '../Constants';
import logger from '../Logger';

type ActionOptions = {
  env: string;
};

type Env = 'local' | 'staging' | 'production';
type BundledNativeModules = Record<string, string>;
interface NativeModule {
  npmPackage: string;
  versionRange: string;
}
type BundledNativeModulesList = NativeModule[];
interface SyncPayload {
  nativeModules: BundledNativeModulesList;
}
interface GetBundledNativeModulesResult {
  data: BundledNativeModulesList;
}

const EXPO_PACKAGE_PATH = path.join(EXPO_DIR, 'packages/expo');

async function main(options: ActionOptions) {
  logger.info('\nSyncing bundledNativeModules.json with www...');

  const env = resolveEnv(options);
  await confirmEnvAsync(env);
  const secret = await resolveSecretAsync();

  const sdkVersion = await resolveTargetSdkVersionAsync();
  const bundledNativeModules = await readBundledNativeModulesAsync();
  const syncPayload = prepareSyncPayload(bundledNativeModules);

  const currentBundledNativeModules = await getCurrentBundledNativeModules(env, sdkVersion);
  await compareAndConfirmAsync(currentBundledNativeModules, syncPayload.nativeModules);

  await syncModulesAsync({ env, secret }, sdkVersion, syncPayload);
  logger.success(`Successfully synced the modules for SDK ${sdkVersion}!`);
}

function resolveEnv({ env }: ActionOptions): Env {
  if (env === 'staging' || env === 'production' || env === 'local') {
    return env;
  } else {
    throw new Error(`Unknown env name: ${env}`);
  }
}

async function confirmEnvAsync(env: Env): Promise<void> {
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

async function readBundledNativeModulesAsync(): Promise<BundledNativeModules> {
  const bundledNativeModulesPath = path.join(EXPO_PACKAGE_PATH, 'bundledNativeModules.json');
  return await JsonFile.readAsync<BundledNativeModules>(bundledNativeModulesPath);
}

async function getCurrentBundledNativeModules(
  env: Env,
  sdkVersion: string
): Promise<BundledNativeModulesList> {
  const baseApiUrl = resolveBaseApiUrl(env);
  const result = await fetch(`${baseApiUrl}/--/api/v2/sdks/${sdkVersion}/native-modules`);
  const resultJson: GetBundledNativeModulesResult = await result.json();
  return resultJson.data;
}

async function compareAndConfirmAsync(
  current: BundledNativeModulesList,
  next: BundledNativeModulesList
): Promise<void> {
  const currentMap = current.reduce(
    (acc, i) => {
      acc[i.npmPackage] = i;
      return acc;
    },
    {} as Record<string, NativeModule>
  );

  logger.info('Changes:');
  let hasChanges = false;
  for (const { npmPackage, versionRange } of next) {
    if (versionRange !== currentMap[npmPackage]?.versionRange) {
      hasChanges = true;
      logger.info(
        ` - ${npmPackage}: ${chalk.red(
          currentMap[npmPackage]?.versionRange ?? '(none)'
        )} -> ${chalk.green(versionRange)}`
      );
    }
  }
  if (!hasChanges) {
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

async function syncModulesAsync(
  { env, secret }: { env: Env; secret: string },
  sdkVersion: string,
  payload: SyncPayload
): Promise<void> {
  const baseApiUrl = resolveBaseApiUrl(env);
  const result = await fetch(`${baseApiUrl}/--/api/v2/sdks/${sdkVersion}/native-modules/sync`, {
    method: 'put',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'expo-sdk-native-modules-secret': secret,
    },
  });

  if (result.status !== 200) {
    throw new Error(`Failed to sync the modules: ${await result.text()}`);
  }
}

function resolveBaseApiUrl(env: Env): string {
  if (env === 'production') {
    return `https://${PRODUCTION_API_HOST}`;
  } else if (env === 'staging') {
    return `https://${STAGING_API_HOST}`;
  } else {
    return `http://${LOCAL_API_HOST}`;
  }
}

/**
 * converts
 * {
 *   "expo-ads-admob": "~10.0.4",
 *   "expo-ads-facebook": "~12.0.4"
 * }
 * to
 * {
 *   "nativeModules": [
 *     { "npmPackage": "expo-ads-admob", "versionRange": "~10.0.4" },
 *     { "npmPackage": "expo-ads-facebook", "versionRange": "~12.0.4" }
 *   ]
 * }
 */
function prepareSyncPayload(bundledNativeModules: BundledNativeModules): SyncPayload {
  return {
    nativeModules: Object.entries(bundledNativeModules).map(([npmPackage, versionRange]) => ({
      npmPackage,
      versionRange,
    })),
  };
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
