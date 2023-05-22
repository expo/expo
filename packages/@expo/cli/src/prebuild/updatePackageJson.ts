import { getPackageJson, PackageJSONConfig } from '@expo/config';
import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import * as Log from '../log';
import { isModuleSymlinked } from '../utils/isModuleSymlinked';
import { logNewSection } from '../utils/ora';

export type DependenciesMap = { [key: string]: string | number };

export type DependenciesModificationResults = {
  /** Indicates that new values were added to the `dependencies` object in the `package.json`. */
  hasNewDependencies: boolean;
  /** Indicates that new values were added to the `devDependencies` object in the `package.json`. */
  hasNewDevDependencies: boolean;
};

/** Modifies the `package.json` with `modifyPackageJson` and format/displays the results. */
export async function updatePackageJSONAsync(
  projectRoot: string,
  {
    templateDirectory,
    pkg,
    skipDependencyUpdate,
  }: {
    templateDirectory: string;
    pkg: PackageJSONConfig;
    skipDependencyUpdate?: string[];
  }
): Promise<DependenciesModificationResults> {
  const updatingPackageJsonStep = logNewSection(
    'Updating your package.json scripts, dependencies, and main file'
  );

  const templatePkg = getPackageJson(templateDirectory);

  const results = modifyPackageJson(projectRoot, {
    templatePkg,
    pkg,
    skipDependencyUpdate,
  });

  await fs.promises.writeFile(
    path.resolve(projectRoot, 'package.json'),
    // Add new line to match the format of running yarn.
    // This prevents the `package.json` from changing when running `prebuild --no-install` multiple times.
    JSON.stringify(pkg, null, 2) + '\n'
  );

  updatingPackageJsonStep.succeed(
    'Updated package.json and added index.js entry point for iOS and Android'
  );

  return results;
}

/**
 * Make required modifications to the `package.json` file as a JSON object.
 *
 * 1. Update `package.json` `scripts`.
 * 2. Update `package.json` `dependencies` and `devDependencies`.
 * 3. Update `package.json` `main`.
 *
 * @param projectRoot The root directory of the project.
 * @param props.templatePkg Template project package.json as JSON.
 * @param props.pkg Current package.json as JSON.
 * @param props.skipDependencyUpdate Array of dependencies to skip updating.
 * @returns
 */
function modifyPackageJson(
  projectRoot: string,
  {
    templatePkg,
    pkg,
    skipDependencyUpdate,
  }: {
    templatePkg: PackageJSONConfig;
    pkg: PackageJSONConfig;
    skipDependencyUpdate?: string[];
  }
) {
  updatePkgScripts({ pkg });

  // TODO: Move to `npx expo-doctor`
  return updatePkgDependencies(projectRoot, {
    pkg,
    templatePkg,
    skipDependencyUpdate,
  });
}

/**
 * Update package.json dependencies by combining the dependencies in the project we are ejecting
 * with the dependencies in the template project. Does the same for devDependencies.
 *
 * - The template may have some dependencies beyond react/react-native/react-native-unimodules,
 *   for example RNGH and Reanimated. We should prefer the version that is already being used
 *   in the project for those, but swap the react/react-native/react-native-unimodules versions
 *   with the ones in the template.
 * - The same applies to expo-updates -- since some native project configuration may depend on the
 *   version, we should always use the version of expo-updates in the template.
 *
 * > Exposed for testing.
 */
export function updatePkgDependencies(
  projectRoot: string,
  {
    pkg,
    templatePkg,
    skipDependencyUpdate = [],
  }: {
    pkg: PackageJSONConfig;
    templatePkg: PackageJSONConfig;
    skipDependencyUpdate?: string[];
  }
): DependenciesModificationResults {
  if (!pkg.devDependencies) {
    pkg.devDependencies = {};
  }
  const { dependencies, devDependencies } = templatePkg;
  const defaultDependencies = createDependenciesMap(dependencies);
  const defaultDevDependencies = createDependenciesMap(devDependencies);

  const combinedDependencies: DependenciesMap = createDependenciesMap({
    ...defaultDependencies,
    ...pkg.dependencies,
  });

  const requiredDependencies = ['expo', 'expo-splash-screen', 'react', 'react-native'].filter(
    (depKey) => !!defaultDependencies[depKey]
  );

  const symlinkedPackages: string[] = [];

  for (const dependenciesKey of requiredDependencies) {
    if (
      // If the local package.json defined the dependency that we want to overwrite...
      pkg.dependencies?.[dependenciesKey]
    ) {
      if (
        // Then ensure it isn't symlinked (i.e. the user has a custom version in their yarn workspace).
        isModuleSymlinked(projectRoot, { moduleId: dependenciesKey, isSilent: true })
      ) {
        // If the package is in the project's package.json and it's symlinked, then skip overwriting it.
        symlinkedPackages.push(dependenciesKey);
        continue;
      }
      if (skipDependencyUpdate.includes(dependenciesKey)) {
        continue;
      }
    }
    combinedDependencies[dependenciesKey] = defaultDependencies[dependenciesKey];
  }

  if (symlinkedPackages.length) {
    Log.log(
      `\u203A Using symlinked ${symlinkedPackages
        .map((pkg) => chalk.bold(pkg))
        .join(', ')} instead of recommended version(s).`
    );
  }

  const combinedDevDependencies: DependenciesMap = createDependenciesMap({
    ...defaultDevDependencies,
    ...pkg.devDependencies,
  });

  // Only change the dependencies if the normalized hash changes, this helps to reduce meaningless changes.
  const hasNewDependencies =
    hashForDependencyMap(pkg.dependencies) !== hashForDependencyMap(combinedDependencies);
  const hasNewDevDependencies =
    hashForDependencyMap(pkg.devDependencies) !== hashForDependencyMap(combinedDevDependencies);
  // Save the dependencies
  if (hasNewDependencies) {
    // Use Object.assign to preserve the original order of dependencies, this makes it easier to see what changed in the git diff.
    pkg.dependencies = Object.assign(pkg.dependencies ?? {}, combinedDependencies);
  }
  if (hasNewDevDependencies) {
    // Same as with dependencies
    pkg.devDependencies = Object.assign(pkg.devDependencies ?? {}, combinedDevDependencies);
  }

  return {
    hasNewDependencies,
    hasNewDevDependencies,
  };
}

/**
 * Create an object of type DependenciesMap a dependencies object or throw if not valid.
 *
 * @param dependencies - ideally an object of type {[key]: string} - if not then this will error.
 */
export function createDependenciesMap(dependencies: any): DependenciesMap {
  if (typeof dependencies !== 'object') {
    throw new Error(`Dependency map is invalid, expected object but got ${typeof dependencies}`);
  } else if (!dependencies) {
    return {};
  }

  const outputMap: DependenciesMap = {};

  for (const key of Object.keys(dependencies)) {
    const value = dependencies[key];
    if (typeof value === 'string') {
      outputMap[key] = value;
    } else {
      throw new Error(
        `Dependency for key \`${key}\` should be a \`string\`, instead got: \`{ ${key}: ${JSON.stringify(
          value
        )} }\``
      );
    }
  }
  return outputMap;
}

/**
 * Update package.json scripts - `npm start` should default to `expo
 * start --dev-client` rather than `expo start` after ejecting, for example.
 */
function updatePkgScripts({ pkg }: { pkg: PackageJSONConfig }) {
  if (!pkg.scripts) {
    pkg.scripts = {};
  }
  if (!pkg.scripts.start?.includes('--dev-client')) {
    pkg.scripts.start = 'expo start --dev-client';
  }
  if (!pkg.scripts.android?.includes('run')) {
    pkg.scripts.android = 'expo run:android';
  }
  if (!pkg.scripts.ios?.includes('run')) {
    pkg.scripts.ios = 'expo run:ios';
  }
}

function normalizeDependencyMap(deps: DependenciesMap): string[] {
  return Object.keys(deps)
    .map((dependency) => `${dependency}@${deps[dependency]}`)
    .sort();
}

export function hashForDependencyMap(deps: DependenciesMap = {}): string {
  const depsList = normalizeDependencyMap(deps);
  const depsString = depsList.join('\n');
  return createFileHash(depsString);
}

export function createFileHash(contents: string): string {
  // this doesn't need to be secure, the shorter the better.
  return crypto.createHash('sha1').update(contents).digest('hex');
}
