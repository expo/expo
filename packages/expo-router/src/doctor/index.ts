import createDebug from 'debug';
import type { PackageJSONConfig } from 'expo/config';
import semverRangeSubset from 'semver/ranges/subset';

const debug = createDebug('expo:router:doctor');

/**
 * Small hack to get the package.json.
 * We do no use import() as this would require changing the rootDir in `tsconfig.json`,
 * which in turn will change the structure of the outDir.
 */
const routerPkg: PackageJSONConfig = require('../../package.json');

const routerDependencies = Object.entries<string>(
  Object.assign({}, routerPkg.dependencies, routerPkg.peerDependencies)
).filter((entry) => entry[1] !== '*');

type IncorrectDependency = {
  packageName: string;
  packageType: 'dependencies' | 'devDependencies';
  expectedVersionOrRange: string;
  actualVersion: string;
};

export function doctor(
  pkg: PackageJSONConfig,
  appReactNavigationPath: string,
  // Reuse the formatting functions from expo-cli
  {
    bold,
    learnMore,
  }: {
    bold: (text: string) => string;
    learnMore: (url: string, options?: { learnMoreMessage?: string; dim?: boolean }) => string;
  }
): IncorrectDependency[] {
  const userDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const libReactNavigationPath = require.resolve('@react-navigation/native');

  const userExcluded = new Set(pkg.expo?.install?.exclude);
  const incorrectDependencies: IncorrectDependency[] = [];

  for (const [dep, allowedRange] of routerDependencies) {
    if (userExcluded.has(dep)) {
      debug(`Skipping ${dep} because it is excluded in the config`);
      continue;
    }

    if (dep === '@react-navigation/native') {
      /**
       * It is best practice for the user to manually install @react-navigation/native.
       * This will ensure the user has the correct version installed at the top level
       */
      if (!userDeps['@react-navigation/native']) {
        incorrectDependencies.push({
          packageName: dep,
          packageType:
            pkg.dependencies && dep in pkg.dependencies ? 'dependencies' : 'devDependencies',
          expectedVersionOrRange: allowedRange,
          actualVersion: 'not-installed',
        });
      }

      if (appReactNavigationPath !== libReactNavigationPath) {
        /**
         * If the user has a dependency with a sub-dependency on @react-navigation/native, this may install a different
         * version of @react-navigation/native than the one required by expo-router.
         *
         * To detect this, we require the caller of this function to first resolve their path to @react-navigation/native, as
         * they will get the 'top' level package. When expo-router resolves the path to @react-navigation/native, if it is different
         * when the versions must not have matched and the package manager installed a nested node_module folder with a different
         * version of @react-navigation/native.
         *
         * This can still occur even when the explicit top version is installed
         */
        console.warn(
          `Detected multiple versions of ${bold('@react-navigation/native')} in your ${bold('node_modules')}. This may lead to unexpected navigation behavior and errors. ${learnMore('https://expo.fyi/router-navigation-deps')}.`
        );
      }
    }

    const usersRange = userDeps[dep];

    /**
     * routerDependencies contains all the dependencies that are required by expo-router,
     * both peerDependencies and dependencies. If the user has not manually installed
     * them, then we should skip them.
     */
    if (!usersRange) {
      continue;
    }

    debug(`Checking ${dep} with ${allowedRange} and found ${usersRange}`);
    if (!usersRange || semverRangeSubset(allowedRange, usersRange)) {
      continue;
    }

    debug(`Incorrect dependency found for ${dep}`);

    incorrectDependencies.push({
      packageName: dep,
      packageType: pkg.dependencies && dep in pkg.dependencies ? 'dependencies' : 'devDependencies',
      expectedVersionOrRange: allowedRange,
      actualVersion: usersRange,
    });
  }

  return incorrectDependencies;
}
