import { getConfig } from '@expo/config';
import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';

import { applyPluginsAsync } from './applyPlugins';
import { checkPackagesAsync } from './checkPackages';
import { installExpoPackageAsync } from './installExpoPackage';
import { Options } from './resolveOptions';
import * as Log from '../log';
import { getVersionedPackagesAsync } from '../start/doctor/dependencies/getVersionedPackages';
import { findUpProjectRootOrAssert } from '../utils/findUp';
import { learnMore } from '../utils/link';
import { setNodeEnv } from '../utils/nodeEnv';
import { joinWithCommasAnd } from '../utils/strings';

/**
 * Installs versions of specified packages compatible with the current Expo SDK version, or
 * checks/ fixes dependencies in project if they don't match compatible versions specified in bundledNativeModules or versions endpoints.
 *
 * @param packages list of packages to install, if installing specific packages and not checking/ fixing
 * @param options options, including check or fix
 * @param packageManagerArguments arguments to forward to the package manager invoked while installing
 * @returns Promise<void>
 */
export async function installAsync(
  packages: string[],
  options: Options & { projectRoot?: string },
  packageManagerArguments: string[] = []
) {
  setNodeEnv('development');
  // Locate the project root based on the process current working directory.
  // This enables users to run `npx expo install` from a subdirectory of the project.
  const projectRoot = options.projectRoot ?? findUpProjectRootOrAssert(process.cwd());
  require('@expo/env').load(projectRoot);

  // Resolve the package manager used by the project, or based on the provided arguments.
  const packageManager = PackageManager.createForProject(projectRoot, {
    npm: options.npm,
    yarn: options.yarn,
    bun: options.bun,
    pnpm: options.pnpm,
    silent: options.silent,
    log: Log.log,
  });

  if (options.check || options.fix) {
    return await checkPackagesAsync(projectRoot, {
      packages,
      options,
      packageManager,
      packageManagerArguments,
    });
  }

  // Read the project Expo config without plugins.
  const { exp } = getConfig(projectRoot, {
    // Sometimes users will add a plugin to the config before installing the library,
    // this wouldn't work unless we dangerously disable plugin serialization.
    skipPlugins: true,
  });

  // Resolve the versioned packages, then install them.
  return installPackagesAsync(projectRoot, {
    packageManager,
    packages,
    packageManagerArguments,
    sdkVersion: exp.sdkVersion!,
  });
}

/** Version packages and install in a project. */
export async function installPackagesAsync(
  projectRoot: string,
  {
    packages,
    packageManager,
    sdkVersion,
    packageManagerArguments,
  }: {
    /**
     * List of packages to version, grouped by the type of dependency.
     * @example ['uuid', 'react-native-reanimated@latest']
     */
    packages: string[];
    /** Package manager to use when installing the versioned packages. */
    packageManager: PackageManager.NodePackageManager;
    /**
     * SDK to version `packages` for.
     * @example '44.0.0'
     */
    sdkVersion: string;
    /**
     * Extra parameters to pass to the `packageManager` when installing versioned packages.
     * @example ['--no-save']
     */
    packageManagerArguments: string[];
  }
): Promise<void> {
  // Read the project Expo config without plugins.
  const { pkg } = getConfig(projectRoot, {
    // Sometimes users will add a plugin to the config before installing the library,
    // this wouldn't work unless we dangerously disable plugin serialization.
    skipPlugins: true,
  });

  //assertNotInstallingExcludedPackages(projectRoot, packages, pkg);

  const versioning = await getVersionedPackagesAsync(projectRoot, {
    packages,
    // sdkVersion is always defined because we don't skipSDKVersionRequirement in getConfig.
    sdkVersion,
    pkg,
  });

  Log.log(
    chalk`\u203A Installing ${
      versioning.messages.length ? versioning.messages.join(' and ') + ' ' : ''
    }using {bold ${packageManager.name}}`
  );

  if (versioning.excludedNativeModules.length) {
    const alreadyExcluded = versioning.excludedNativeModules.filter(
      (module) => module.isExcludedFromValidation
    );
    const specifiedExactVersion = versioning.excludedNativeModules.filter(
      (module) => !module.isExcludedFromValidation
    );

    if (alreadyExcluded.length) {
      Log.log(
        chalk`\u203A Using ${joinWithCommasAnd(
          alreadyExcluded.map(
            ({ bundledNativeVersion, name, specifiedVersion }) =>
              `${specifiedVersion || 'latest'} instead of  ${bundledNativeVersion} for ${name}`
          )
        )} because ${
          alreadyExcluded.length > 1 ? 'they are' : 'it is'
        } listed in {bold expo.install.exclude} in package.json. ${learnMore(
          'https://expo.dev/more/expo-cli/#configuring-dependency-validation'
        )}`
      );
    }

    if (specifiedExactVersion.length) {
      Log.log(
        chalk`\u203A Using ${joinWithCommasAnd(
          specifiedExactVersion.map(
            ({ bundledNativeVersion, name, specifiedVersion }) =>
              `${specifiedVersion} instead of ${bundledNativeVersion} for ${name}`
          )
        )} because ${
          specifiedExactVersion.length > 1 ? 'these versions' : 'this version'
        } was explicitly provided. Packages excluded from dependency validation should be listed in {bold expo.install.exclude} in package.json. ${learnMore(
          'https://expo.dev/more/expo-cli/#configuring-dependency-validation'
        )}`
      );
    }
  }

  // if updating expo package, install this first, then re-run the command minus expo to install everything else
  if (packages.find((pkg) => pkg === 'expo')) {
    const packagesMinusExpo = packages.filter((pkg) => pkg !== 'expo');

    await installExpoPackageAsync(projectRoot, {
      packageManager,
      packageManagerArguments,
      expoPackageToInstall: versioning.packages.find((pkg) => pkg.startsWith('expo@'))!,
      followUpCommandArgs: packagesMinusExpo,
    });

    // follow-up commands will be spawned in a detached process, so return immediately
    return;
  }

  await packageManager.addAsync([...packageManagerArguments, ...versioning.packages]);

  await applyPluginsAsync(projectRoot, versioning.packages);
}
