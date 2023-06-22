import escapeRegExp from 'lodash/escapeRegExp';

import type { Package } from '../../Packages';
import { FileTransforms } from '../../Transforms.types';
import { packagesToKeep, packagesToRename } from './packagesConfig';
import { deleteLinesBetweenTags } from './utils';

function expoModulesBaseTransforms(pkg: Package, abiVersion: string): FileTransforms {
  return {
    path: [
      {
        find: 'src/main/java',
        replaceWith: `src/main/java/${abiVersion}`,
      },
      {
        find: 'src/main/kotlin',
        replaceWith: `src/main/java/${abiVersion}`,
      },
      {
        find: 'src/main/AndroidManifest.xml',
        replaceWith: 'src/main/TemporaryExpoModuleAndroidManifest.xml',
      },
    ],
    content: [
      {
        // manifest-merger requires the legacy package name to be present in the manifest,
        // filling the package name from `pkg.androidPackageNamespace`.
        paths: './src/main/AndroidManifest.xml',
        find: /^(<manifest)([\w\s>])/,
        replaceWith: `$1 package="${pkg.androidPackageNamespace}"$2`,
      },
      ...packagesToKeep.map((pkg: string) => ({
        paths: ['./src/main/{java,kotlin}/**/*.{java,kt}', './src/main/AndroidManifest.xml'],
        find: new RegExp(`([, ^(<])${escapeRegExp(pkg)}`, 'g'),
        replaceWith: `$1temporarydonotversion.${pkg}`,
      })),
      ...packagesToRename.map((pkg: string) => ({
        paths: ['./src/main/{java,kotlin}/**/*.{java,kt}', './src/main/AndroidManifest.xml'],
        find: new RegExp(`([, ^(<])${escapeRegExp(pkg)}`, 'g'),
        replaceWith: `$1${abiVersion}.${pkg}`,
      })),
      {
        paths: ['./src/main/{java,kotlin}/**/*.{java,kt}', './src/main/AndroidManifest.xml'],
        find: /temporarydonotversion\./g,
        replaceWith: '',
      },
      {
        paths: './src/main/{java,kotlin}/**/*.java',
        find: /\/\/ *EXPO_VERSIONING_NEEDS_EXPOVIEW_R/g,
        replaceWith: `import ${abiVersion}.host.exp.expoview.R;`,
      },
      {
        paths: './src/main/{java,kotlin}/**/*.kt',
        find: /\/\/ *EXPO_VERSIONING_NEEDS_EXPOVIEW_R/g,
        replaceWith: `import ${abiVersion}.host.exp.expoview.R`,
      },
    ],
  };
}

export function expoModulesTransforms(pkg: Package, abiVersion: string): FileTransforms {
  const module = pkg.packageName;
  const base = expoModulesBaseTransforms(pkg, abiVersion);
  const moduleTransforms: Record<string, FileTransforms> = {
    'expo-modules-core': {
      content: [
        {
          // We don't have dedicated gradle files for versioned expo-modules.
          // For the BuildConfig, replace with unversioned expoview BuildConfig.
          paths: './**/*.{java,kt}',
          find: new RegExp(`\\bimport ${abiVersion}\\.expo\\.modules\\.BuildConfig`, 'g'),
          replaceWith: 'import host.exp.expoview.BuildConfig',
        },
      ],
    },
    'expo-updates': {
      content: [
        {
          paths: './src/main/{java,kotlin}/expo/modules/updates/UpdatesPackage.kt',
          transform: (text: string) =>
            deleteLinesBetweenTags(
              /WHEN_VERSIONING_REMOVE_FROM_HERE/,
              /WHEN_VERSIONING_REMOVE_TO_HERE/,
              text
            ),
        },
        {
          paths: './**/*.kt',
          find: /BuildConfig\.(EX_UPDATES_NATIVE_DEBUG|EX_UPDATES_ANDROID_DELAY_LOAD_APP)/g,
          replaceWith: 'false',
        },
      ],
    },
  };
  const transforms: FileTransforms = moduleTransforms[module] ?? {};

  return {
    path: [...(base.path ?? []), ...(transforms.path ?? [])],
    content: [...(base.content ?? []), ...(transforms.content ?? [])],
  };
}
