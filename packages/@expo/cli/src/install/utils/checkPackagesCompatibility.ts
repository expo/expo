// note(Simek): reference https://github.com/react-native-community/directory/blob/main/pages/api/libraries/check.ts
import { styleText } from 'node:util';

import { Log } from '../../log';
import { chunk } from '../../utils/array';
import { fetch } from '../../utils/fetch';
import { learnMore } from '../../utils/link';

export type ReactNativeDirectoryCheckResult = {
  unmaintained: boolean;
  newArchitecture: 'supported' | 'unsupported' | 'untested';
};

export type DirectoryCheckResponse = Record<string, ReactNativeDirectoryCheckResult>;

export const MAX_PACKAGES_PER_QUERY = 50;
const ERROR_MESSAGE =
  'Unable to fetch compatibility data from React Native Directory. Skipping check.';

export async function checkPackagesCompatibility(packages: string[]) {
  try {
    const packagesToCheck = packages.filter(
      (packageName) =>
        !packageName.startsWith('@expo/') && !packageName.startsWith('@expo-google-fonts/')
    );

    if (!packagesToCheck.length) {
      return;
    }

    const chunkedPackages = chunk(packagesToCheck, MAX_PACKAGES_PER_QUERY);

    const results = await Promise.allSettled<DirectoryCheckResponse>(
      chunkedPackages.map((packageChunk) =>
        fetch(
          `https://reactnative.directory/api/libraries/check?${new URLSearchParams({ packages: packageChunk.join(',') })}`
        ).then((response) => {
          if (!response.ok) {
            throw new Error(ERROR_MESSAGE);
          }
          return response.json();
        })
      )
    );

    const packageMetadata = results.reduce<DirectoryCheckResponse>((acc, result) => {
      if (result.status === 'fulfilled') {
        return { ...acc, ...result.value };
      }
      Log.log(styleText('gray', ERROR_MESSAGE));
      return acc;
    }, {});

    const incompatiblePackages = packagesToCheck.filter(
      (packageName) => packageMetadata[packageName]?.newArchitecture === 'unsupported'
    );

    if (incompatiblePackages.length) {
      Log.warn(
        styleText(
          'yellow',
          `${styleText('bold', 'Warning')}: ${formatPackageNames(incompatiblePackages)} do${incompatiblePackages.length > 1 ? '' : 'es'} not support the New Architecture. ${learnMore('https://docs.expo.dev/guides/new-architecture/')}`
        )
      );
    }
  } catch {
    Log.log(styleText('gray', ERROR_MESSAGE));
  }
}

function formatPackageNames(incompatiblePackages: string[]) {
  if (incompatiblePackages.length === 1) {
    return incompatiblePackages.join();
  }

  const lastPackage = incompatiblePackages.pop();
  return `${incompatiblePackages.join(', ')} and ${lastPackage}`;
}
