// note(Simek): https://github.com/react-native-community/directory/blob/main/pages/api/libraries/check.ts
import chalk from 'chalk';

import { Log } from '../../log';

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

    otherPackages.forEach((packageName) => {
      if (packageMetadata[packageName].newArchitecture === 'unsupported') {
        Log.warn(
          chalk.yellow(
            `${chalk.bold('Warning')}: "${packageName}" does not support New Architecture`
          )
        );
      }
    });
  } catch {
    Log.log(chalk.gray('Unable to fetch compatibility data from React Native Directory!'));
  }
}
