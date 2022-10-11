import escapeRegExp from 'lodash/escapeRegExp';

import { transformString } from '../../../Transforms';
import { FileTransform, FileTransforms, StringTransform } from '../../../Transforms.types';
import { baseCmakeTransforms } from '../cmakeTransforms';
import { JniLibNames } from '../libraries';
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
      // currently it's matching only reanimated
      ...[...JniLibNames, 'fb', 'fbjni'].map((libName) => ({
        paths: '*.java',
        find: new RegExp(`(SoLoader|System).loadLibrary\\\("${escapeRegExp(libName)}"\\\)`),
        replaceWith: `$1.loadLibrary("${libName}_${abiVersion}")`,
      })),
      {
        paths: '*.{java,h,cpp}',
        find: /versioned\/host\/exp\/exponent\/modules\/api\/reanimated/g,
        replaceWith: `${abiVersion}/host/exp/exponent/modules/api/reanimated`,
      },
      {
        paths: './**/reanimated/NativeProxy.java',
        find: /\bimport (com\.swmansion\.)/g,
        replaceWith: `import ${abiVersion}.$1`,
      },
      ...reanimatedCmakeTransforms(abiVersion),
    ],
  };
}

function reanimatedCmakeTransforms(abiVersion: string): FileTransform[] {
  const libNames = JniLibNames.map((lib: string): string =>
    lib.startsWith('lib') ? lib.slice(3) : lib
  ).filter((lib: string) => !['fbjni'].includes(lib));
  const renameSecondArg = (text: string) =>
    transformString(
      text,
      libNames.map((lib) => ({
        find: new RegExp(`^(\\\s*\\\S+\\\s+)${escapeRegExp(lib)}($|\\\s)`),
        replaceWith: `$1${lib}_${abiVersion}$2`,
      }))
    );

  return [
    ...baseCmakeTransforms(abiVersion, libNames).map((transform: StringTransform) => ({
      paths: 'CMakeLists.txt',
      ...transform,
    })),
    {
      paths: 'CMakeLists.txt',
      find: /(find_library\()([\s\S]*?)(\))/g,
      replaceWith: (_, p1, p2, p3) => [p1, renameSecondArg(p2), p3].join(''),
    },
    {
      paths: 'CMakeLists.txt',
      find: 'set (PACKAGE_NAME "reanimated")',
      replaceWith: `set (PACKAGE_NAME "reanimated_${abiVersion}")`,
    },
    {
      paths: 'CMakeLists.txt',
      find: /\b(libhermes)\b/,
      replaceWith: `$1_${abiVersion}`,
    },
  ];
}
