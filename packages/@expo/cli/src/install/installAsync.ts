import { getConfig } from '@expo/config';
import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';
import npmPackageArg from 'npm-package-arg';
import path from 'path';
import assert from 'assert';
import resolveFrom from 'resolve-from';

import { getVersionsAsync } from '../api/getVersions';
import * as Log from '../log';
import { getBundledNativeModulesAsync } from '../start/doctor/dependencies/bundledNativeModules';
import { CommandError } from '../utils/errors';
import { autoAddConfigPluginsAsync } from './utils/autoAddConfigPluginsAsync';

type Options = Pick<PackageManager.CreateForProjectOptions, 'npm' | 'yarn'>;

function findUpPackageJson(cwd: string) {
  let found = resolveFrom(cwd, 'package.json');
  if (found) {
    return found;
  }
  return findUpPackageJson(path.dirname(cwd));
}

export type DependencyList = Record<string, string>;

export async function getRemoteVersionsForSdkAsync(sdkVersion?: string): Promise<DependencyList> {
  const { sdkVersions } = await getVersionsAsync({ skipCache: true });
  if (sdkVersion && sdkVersion in sdkVersions) {
    const { relatedPackages, facebookReactVersion, facebookReactNativeVersion } =
      sdkVersions[sdkVersion];
    const reactVersion = facebookReactVersion
      ? {
          react: facebookReactVersion,
          'react-dom': facebookReactVersion,
        }
      : undefined;
    return {
      ...relatedPackages,
      ...reactVersion,
      'react-native': facebookReactNativeVersion,
    };
  }
  return {};
}

export async function installAsync(packages: string[], options: Options, extras: string[] = []) {
  const projectRoot = await findUpPackageJson(process.cwd());

  const packageManager = PackageManager.createForProject(projectRoot, {
    npm: options.npm,
    yarn: options.yarn,
    log: Log.log,
  });

  const { exp, pkg } = getConfig(projectRoot, {
    // Sometimes users will add a plugin to the config before installing the library,
    // this wouldn't work unless we dangerously disable plugin serialization.
    skipPlugins: true,
  });
  assert(exp.sdkVersion);

  // This shouldn't be invoked because `findProjectRootAsync` will throw if node_modules are missing.
  // Every React project should have react installed...
  if (!resolveFrom.silent(projectRoot, 'react')) {
    Log.log();
    Log.log(chalk.cyan(`node_modules not found, running ${packageManager.name} install command.`));
    Log.log();
    await packageManager.installAsync();
  }

  const bundledNativeModules = await getBundledNativeModulesAsync(projectRoot, exp.sdkVersion!);
  const versionsForSdk = await getRemoteVersionsForSdkAsync(exp.sdkVersion);

  let nativeModulesCount = 0;
  let othersCount = 0;

  const versionedPackages = packages.map((arg) => {
    const { name, type, raw } = npmPackageArg(arg);

    if (['tag', 'version', 'range'].includes(type) && name && bundledNativeModules[name]) {
      // Unimodule packages from npm registry are modified to use the bundled version.
      nativeModulesCount++;
      return `${name}@${bundledNativeModules[name]}`;
    } else if (name && versionsForSdk[name]) {
      // Some packages have the recommended version listed in https://exp.host/--/api/v2/versions.
      othersCount++;
      return `${name}@${versionsForSdk[name]}`;
    } else {
      // Other packages are passed through unmodified.
      othersCount++;
      return raw;
    }
  });

  const messages = getOperationLog({
    othersCount,
    nativeModulesCount,
    sdkVersion: exp.sdkVersion!,
  });

  Log.log(`Installing ${messages.join(' and ')} using ${packageManager.name}.`);

  if (extras.length) {
    await packageManager.addWithParametersAsync(versionedPackages, extras);
  }

  try {
    const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true, skipPlugins: true });

    // Only auto add plugins if the plugins array is defined or if the project is using SDK +42.
    await autoAddConfigPluginsAsync(
      projectRoot,
      exp,
      versionedPackages.map((pkg) => pkg.split('@')[0]).filter(Boolean)
    );
  } catch (error: any) {
    if (error.isPluginError) {
      Log.warn(`Skipping config plugin check: ` + error.message);
      return;
    }
    throw error;
  }
}

function getOperationLog({
  nativeModulesCount,
  sdkVersion,
  othersCount,
}: {
  nativeModulesCount: number;
  othersCount: number;
  sdkVersion: string;
}): string[] {
  return [
    nativeModulesCount > 0 &&
      `${nativeModulesCount} SDK ${sdkVersion} compatible native ${
        nativeModulesCount === 1 ? 'module' : 'modules'
      }`,
    othersCount > 0 && `${othersCount} other ${othersCount === 1 ? 'package' : 'packages'}`,
  ].filter(Boolean) as string[];
}
