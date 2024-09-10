// note(Simek): https://github.com/react-native-community/directory/blob/main/pages/api/libraries/check.ts
import chalk from 'chalk';

import { Log } from '../../log';
import { learnMore } from '../../utils/link';

export type ReactNativeDirectoryCheckResult = {
  unmaintained: boolean;
  newArchitecture: 'supported' | 'unsupported' | 'untested';
};

export async function checkPackagesCompatibility(otherPackages: string[]) {
  try {
    const response = await fetch('https://reactnative.directory/api/libraries/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ packages: otherPackages }),
    });

    if (!response.ok) {
      Log.log(chalk.gray('Unable to fetch compatibility data from React Native Directory!'));
    }

    const packageMetadata = (await response.json()) as Record<
      string,
      ReactNativeDirectoryCheckResult
    >;

    const incompatiblePackages = otherPackages.filter(
      (packageName) => packageMetadata[packageName]?.newArchitecture === 'unsupported'
    );

    if (incompatiblePackages.length) {
      Log.warn(
        chalk.yellow(
          `${chalk.bold('Warning')}: ${formatPackageNames(incompatiblePackages)} do not support the New Architecture. ${learnMore('https://docs.expo.dev/guides/new-architecture/')}`
        )
      );
    }
  } catch {
    Log.log(chalk.gray('Unable to fetch compatibility data from React Native Directory!'));
  }
}

function formatPackageNames(incompatiblePackages: string[]) {
  if (incompatiblePackages.length === 1) {
    return incompatiblePackages.join();
  }

  const lastPackage = incompatiblePackages.pop();
  return `${incompatiblePackages.join(', ')} and ${lastPackage}`;
}
