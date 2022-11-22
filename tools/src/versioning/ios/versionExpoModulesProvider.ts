import fs from 'fs-extra';
import path from 'path';

import { IOS_DIR } from '../../Constants';
import { copyFileWithTransformsAsync } from '../../Transforms';
import { execAll } from '../../Utils';
import { getVersionedDirectory, getVersionPrefix } from './utils';

// Name of the pod containing versioned modules provider.
export const MODULES_PROVIDER_POD_NAME = 'ExpoModulesProvider';

// Filename of the provider used by autolinking.
const MODULES_PROVIDER_FILENAME = 'ExpoModulesProvider.swift';

// Autolinking generates the unversioned provider at this path.
const UNVERSIONED_MODULES_PROVIDER_PATH = path.join(
  IOS_DIR,
  'Pods',
  'Target Support Files',
  'Pods-Expo Go-Expo Go (unversioned)',
  MODULES_PROVIDER_FILENAME
);

/**
 * Versions Swift modules provider into ExpoKit directory.
 */
export async function versionExpoModulesProviderAsync(sdkNumber: number) {
  const prefix = getVersionPrefix(sdkNumber);
  const targetDirectory = path.join(getVersionedDirectory(sdkNumber), MODULES_PROVIDER_POD_NAME);

  await fs.mkdirs(targetDirectory);

  const { content } = await copyFileWithTransformsAsync({
    sourceFile: MODULES_PROVIDER_FILENAME,
    sourceDirectory: path.dirname(UNVERSIONED_MODULES_PROVIDER_PATH),
    targetDirectory,
    transforms: {
      content: [
        {
          find: /\bimport (Expo|EX|EAS)/g,
          replaceWith: `import ${prefix}$1`,
        },
        {
          find: /@objc\((Expo|EAS)(.*?)\)/g,
          replaceWith: `@objc(${prefix}$1$2)`,
        },
      ],
    },
  });

  const podspecPath = path.join(
    targetDirectory,
    `${prefix}${MODULES_PROVIDER_POD_NAME}.podspec.json`
  );
  const podspec = {
    name: `${prefix}${MODULES_PROVIDER_POD_NAME}`,
    version: '' + sdkNumber,
    summary: 'Pod containing versioned Swift modules provider',
    authors: '650 Industries, Inc.',
    homepage: 'https://expo.dev',
    license: 'MIT',
    platforms: {
      ios: '13.0',
    },
    source: {
      git: 'https://github.com/expo/expo.git',
    },
    source_files: MODULES_PROVIDER_FILENAME,
    pod_target_xcconfig: {
      DEFINES_MODULE: 'YES',
    },
    dependencies: execAll(/\bimport\s+(\w+?)\b/g, content, 1).reduce((acc, match) => {
      acc[match] = [];
      return acc;
    }, {} as Record<string, any[]>),
  };

  await fs.outputJSON(podspecPath, podspec, { spaces: 2 });
}
