import escapeRegExp from 'lodash/escapeRegExp';

import { FileTransforms } from '../../../Transforms.types';
import { packagesToKeep, packagesToRename } from '../packagesConfig';
import { deleteLinesBetweenTags } from '../utils';

export function expoviewTransforms(abiVersion: string): FileTransforms {
  const sdkVersion = abiVersion.replace(/abi(\d+)_0_0/, 'sdk$1');
  return {
    path: [
      {
        find: 'src/main/java/versioned',
        replaceWith: `src/main/java/${abiVersion}`,
      },
      {
        find: 'src/main/java/com',
        replaceWith: `src/main/java/${abiVersion}/com`,
      },
    ],
    content: [
      {
        paths: './build.gradle',
        find: /\/\/ WHEN_VERSIONING_REPLACE_WITH_DEPENDENCIES/g,
        replaceWith: 'implementation project(":expoview")',
      },
      {
        paths: ['./build.gradle', './src/main/AndroidManifest.xml'],
        transform: (text: string) =>
          deleteLinesBetweenTags(
            /WHEN_VERSIONING_REMOVE_FROM_HERE/,
            /WHEN_VERSIONING_REMOVE_TO_HERE/,
            text
          ),
      },
      {
        paths: './build.gradle',
        find: /.*WHEN_VERSIONING_UNCOMMENT_(TO_HERE|FROM_HERE).*\n/g,
        replaceWith: '',
      },
      {
        paths: './build.gradle',
        find: `useVendoredModulesForExpoView('unversioned')`,
        replaceWith: `useVendoredModulesForExpoView('${sdkVersion}')`,
      },
      {
        paths: './src/main/AndroidManifest.xml',
        find: /host\.exp\.expoview/g,
        replaceWith: `${abiVersion}.host.exp.expoview`,
      },
      {
        paths: './src/main/AndroidManifest.xml',
        find: /versioned\.host\.exp\.exponent/g,
        replaceWith: `${abiVersion}.host.exp.exponent`,
      },
      ...packagesToKeep.map((pkg: string) => ({
        paths: './src/main/java/**/*.{java,kt}',
        find: new RegExp(`([, ^(<])${escapeRegExp(pkg)}`, 'g'),
        replaceWith: `$1temporarydonotversion.${pkg}`,
      })),
      {
        paths: './src/main/java/**/*.{java,kt}',
        find: /import (static |)expo\./g,
        replaceWith: `import $1${abiVersion}.expo.`,
      },
      {
        paths: './src/main/java/**/*.{java,kt}',
        find: /versioned\.host\.exp\.exponent/g,
        replaceWith: `${abiVersion}.host.exp.exponent`,
      },
      ...packagesToRename.map((pkg: string) => ({
        paths: './src/main/java/**/*.{java,kt}',
        find: new RegExp(`([, ^(<])${escapeRegExp(pkg)}`, 'g'),
        replaceWith: `$1${abiVersion}.${pkg}`,
      })),
      {
        paths: `./src/main/java/**/*.{java,kt}`,
        find: /temporarydonotversion\./g,
        replaceWith: '',
      },
      {
        paths: './**/reanimated/NativeProxy.java',
        find: /\b(com\.swmansion\.)/g,
        replaceWith: `${abiVersion}.$1`,
      },
      {
        paths: './**/ExpoTurboPackage.kt',
        find: /\bimport (com\.swmansion\.)/g,
        replaceWith: `import ${abiVersion}.$1`,
      },
    ],
  };
}
