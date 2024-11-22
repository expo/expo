// note(Simek): https://github.com/react-native-community/directory/blob/main/pages/api/libraries/check.ts
import chalk from 'chalk';

import { Log } from '../../log';
import { fetch } from '../../utils/fetch';
import { learnMore } from '../../utils/link';

export type ReactNativeDirectoryCheckResult = {
  unmaintained: boolean;
  newArchitecture: 'supported' | 'unsupported' | 'untested';
};

const ERROR_MESSAGE =
  'Unable to fetch compatibility data from React Native Directory. Skipping check.';

export async function checkPackagesCompatibility(packages: string[]) {
  try {
    const response = await fetch('https://reactnative.directory/api/libraries/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ packages }),
    });

    if (!response.ok) {
      Log.log(chalk.gray(ERROR_MESSAGE));
    }

    const packageMetadata = (await response.json()) as Record<
      string,
      ReactNativeDirectoryCheckResult
    >;

    const incompatiblePackages = packages.filter(
      (packageName) => packageMetadata[packageName]?.newArchitecture === 'unsupported'
    );

    if (incompatiblePackages.length) {
      Log.warn(
        chalk.yellow(
          `${chalk.bold('Warning')}: ${formatPackageNames(incompatiblePackages)} do${incompatiblePackages.length > 1 ? '' : 'es'} not support the New Architecture. ${learnMore('https://docs.expo.dev/guides/new-architecture/')}`
        )
      );
    }
  } catch {
    Log.log(chalk.gray(ERROR_MESSAGE));
  }
}

function formatPackageNames(incompatiblePackages: string[]) {
  if (incompatiblePackages.length === 1) {
    return incompatiblePackages.join();
  }

  const lastPackage = incompatiblePackages.pop();
  return `${incompatiblePackages.join(', ')} and ${lastPackage}`;
}
