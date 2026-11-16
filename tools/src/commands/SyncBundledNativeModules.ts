import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import semver from 'semver';

import { EXPO_DIR, LOCAL_API_HOST } from '../Constants';
import logger from '../Logger';
import * as Versions from '../Versions';

type ActionOptions = {
  env: string;
  yes?: boolean;
  dryRun?: boolean;
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

export async function syncBundledNativeModulesAsync(options: ActionOptions): Promise<void> {
  logger.info('\nSyncing bundledNativeModules.json with www...');

  const env = resolveEnv(options);
  if (!options.yes && !options.dryRun) await confirmEnvAsync(env);
  const secret = options.dryRun ? undefined : await resolveSecretAsync(!!options.yes);

  const sdkVersion = await resolveTargetSdkVersionAsync(!!options.yes || !!options.dryRun);
  const bundledNativeModules = await readBundledNativeModulesAsync();
  const syncPayload = prepareSyncPayload(bundledNativeModules);

  const currentBundledNativeModules = await getCurrentBundledNativeModules(env, sdkVersion);
  const changed = await compareAndConfirmAsync(
    currentBundledNativeModules,
    syncPayload.nativeModules,
    !!options.yes || !!options.dryRun
  );
  if (!changed || options.dryRun) return;

  await syncModulesAsync({ env, secret: secret! }, sdkVersion, syncPayload);
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

async function resolveSecretAsync(nonInteractive: boolean): Promise<string> {
  if (process.env.EXPO_SDK_NATIVE_MODULES_SECRET) {
    return process.env.EXPO_SDK_NATIVE_MODULES_SECRET;
  }

  if (nonInteractive || process.env.CI) {
    throw new Error('EXPO_SDK_NATIVE_MODULES_SECRET is not set');
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

async function resolveTargetSdkVersionAsync(nonInteractive: boolean): Promise<string> {
  const expoPackageJsonPath = path.join(EXPO_PACKAGE_PATH, 'package.json');
  const contents = await JsonFile.readAsync<Record<string, string>>(expoPackageJsonPath);
  const majorVersion = semver.major(contents.version);

  const sdkVersion = `${majorVersion}.0.0`;
  if (nonInteractive) return sdkVersion;

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
  const result = await fetch(`${baseApiUrl}/v2/sdks/${sdkVersion}/native-modules`);
  if (!result.ok) {
    throw new Error(`Failed to read native modules for SDK ${sdkVersion}: HTTP ${result.status}`);
  }
  const resultJson = (await result.json()) as GetBundledNativeModulesResult;
  if (!Array.isArray(resultJson.data)) {
    throw new Error('Invalid native modules response: expected a data array');
  }
  return resultJson.data;
}

async function compareAndConfirmAsync(
  current: BundledNativeModulesList,
  next: BundledNativeModulesList,
  nonInteractive: boolean
): Promise<boolean> {
  const currentMap = current.reduce(
    (acc, i) => {
      acc[i.npmPackage] = i;
      return acc;
    },
    {} as Record<string, NativeModule>
  );
  const nextMap = next.reduce(
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
  for (const { npmPackage, versionRange } of current) {
    if (!nextMap[npmPackage]) {
      hasChanges = true;
      logger.info(` - ${npmPackage}: ${chalk.red(versionRange)} -> ${chalk.green('(removed)')}`);
    }
  }
  if (!hasChanges) {
    logger.info(chalk.gray('(no changes found)'));
    return false;
  }

  if (nonInteractive) return true;

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
  return true;
}

async function syncModulesAsync(
  { env, secret }: { env: Env; secret: string },
  sdkVersion: string,
  payload: SyncPayload
): Promise<void> {
  const baseApiUrl = resolveBaseApiUrl(env);
  const result = await fetch(`${baseApiUrl}/v2/sdks/${sdkVersion}/native-modules/sync`, {
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
    return `https://${Versions.VersionsApiHost.PRODUCTION}`;
  } else if (env === 'staging') {
    return `https://${Versions.VersionsApiHost.STAGING}`;
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
    .option(
      '-y, --yes',
      'Sync without confirmation prompts; requires the secret in the environment.',
      false
    )
    .option('--dry-run', 'Show changes without updating www.', false)
    .asyncAction(syncBundledNativeModulesAsync);
};
