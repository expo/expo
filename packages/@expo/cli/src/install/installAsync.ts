import { getConfig } from '@expo/config';
import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';

import * as Log from '../log';
import {
  getOperationLog,
  getVersionedPackagesAsync,
} from '../start/doctor/dependencies/getVersionedPackages';
import { getVersionedDependenciesAsync } from '../start/doctor/dependencies/validateDependenciesVersions';
import { groupBy } from '../utils/array';
import { findUpProjectRootOrAssert } from '../utils/findUp';
import { checkPackagesAsync } from './checkPackages';
import { Options } from './resolveOptions';

export async function installAsync(
  packages: string[],
  options: Options & { projectRoot?: string },
  packageManagerArguments: string[] = []
) {
  // Locate the project root based on the process current working directory.
  // This enables users to run `npx expo install` from a subdirectory of the project.
  const projectRoot = options.projectRoot ?? findUpProjectRootOrAssert(process.cwd());

  // Resolve the package manager used by the project, or based on the provided arguments.
  const packageManager = PackageManager.createForProject(projectRoot, {
    npm: options.npm,
    yarn: options.yarn,
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
  const versioning = await getVersionedPackagesAsync(projectRoot, {
    packages,
    // sdkVersion is always defined because we don't skipSDKVersionRequirement in getConfig.
    sdkVersion,
  });

  Log.log(
    chalk`\u203A Installing ${
      versioning.messages.length ? versioning.messages.join(' and ') + ' ' : ''
    }using {bold ${packageManager.name}}`
  );

  await packageManager.addAsync([...packageManagerArguments, ...versioning.packages]);

  await applyPluginsAsync(projectRoot, versioning.packages);
}

export async function fixPackagesAsync(
  projectRoot: string,
  {
    packages,
    packageManager,
    sdkVersion,
    packageManagerArguments,
  }: {
    packages: Awaited<ReturnType<typeof getVersionedDependenciesAsync>>;
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
  if (!packages.length) {
    return;
  }

  const { dependencies = [], devDependencies = [] } = groupBy(packages, (dep) => dep.packageType);
  const versioningMessages = getOperationLog({
    othersCount: 0, // All fixable packages are versioned
    nativeModulesCount: packages.length,
    sdkVersion,
  });

  Log.log(
    chalk`\u203A Installing ${
      versioningMessages.length ? versioningMessages.join(' and ') + ' ' : ''
    }using {bold ${packageManager.name}}`
  );

  if (dependencies.length) {
    const versionedPackages = dependencies.map(
      (dep) => `${dep.packageName}@${dep.expectedVersionOrRange}`
    );

    await packageManager.addAsync([...packageManagerArguments, ...versionedPackages]);

    await applyPluginsAsync(projectRoot, versionedPackages);
  }

  if (devDependencies.length) {
    await packageManager.addDevAsync([
      ...packageManagerArguments,
      ...devDependencies.map((dep) => `${dep.packageName}@${dep.expectedVersionOrRange}`),
    ]);
  }
}

/**
 * A convenience feature for automatically applying Expo Config Plugins to the `app.json` after installing them.
 * This should be dropped in favor of autolinking in the future.
 */
async function applyPluginsAsync(projectRoot: string, packages: string[]) {
  const { autoAddConfigPluginsAsync } = await import('./utils/autoAddConfigPlugins');

  try {
    const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });

    // Only auto add plugins if the plugins array is defined or if the project is using SDK +42.
    await autoAddConfigPluginsAsync(
      projectRoot,
      exp,
      // Split any possible NPM tags. i.e. `expo@latest` -> `expo`
      packages.map((pkg) => pkg.split('@')[0]).filter(Boolean)
    );
  } catch (error: any) {
    // If we fail to apply plugins, the log a warning and continue.
    if (error.isPluginError) {
      Log.warn(`Skipping config plugin check: ` + error.message);
      return;
    }
    // Any other error, rethrow.
    throw error;
  }
}
