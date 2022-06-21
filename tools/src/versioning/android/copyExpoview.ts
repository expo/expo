import fs from 'fs-extra';
import escapeRegExp from 'lodash/escapeRegExp';
import path from 'path';

import { copyFileWithTransformsAsync, FileTransforms } from '../../Transforms';
import { searchFilesAsync } from '../../Utils';
import { packagesToKeep, packagesToRename } from './config';

function deleteLinesBetweenTags(
  startRegex: RegExp | string,
  endRegex: RegExp | string,
  fileContent: string
): string {
  const lines = fileContent.split(/\r?\n/);
  let insideTags = 0;
  const filteredLines = lines.filter((line) => {
    if (line.match(startRegex)) {
      insideTags += 1;
    }

    const shouldDelete = insideTags > 0;

    if (line.match(endRegex)) {
      insideTags -= 1;
    }
    return !shouldDelete;
  });
  return filteredLines.join('\n');
}

export async function copyExpoviewAsync(sdkVersion: string, androidDir: string): Promise<void> {
  const abiVersion = `abi${sdkVersion.replace(/\./g, '_')}`;
  const targetDirectory = path.join(androidDir, `versioned-abis/expoview-${abiVersion}`);
  const sourceDirectory = path.join(androidDir, 'expoview');
  const transforms: FileTransforms = {
    path: [
      {
        find: /src\/main\/java\/versioned/,
        replaceWith: `src/main/java/${abiVersion}`,
      },
      {
        find: /src\/main\/java\/com/,
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
        fn: (text: string) =>
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
      //{
      //  paths: './src/main/java/**/*.{java,kt}',
      //  find: /import (static |)versioned\.host\.exp\.exponent/g,
      //  replaceWith: `import $1${abiVersion}.host.exp.exponent`,
      //},
      {
        paths: './src/main/java/**/*.{java,kt}',
        find: /import (static |)expo\./g,
        replaceWith: `import $1${abiVersion}.expo.`,
      },
      //{
      //  paths: './src/main/java/**/*.{java,kt}',
      //  find: /package versioned\.host\.exp\.exponent/g,
      //  replaceWith: `package ${abiVersion}.host.exp.exponent`,
      //},
      {
        paths: './src/main/java/**/*.{java,kt}',
        find: /versioned\.host\.exp\.exponent/g,
        replaceWith: `${abiVersion}.host.exp.exponent`,
      },
      ...packagesToRename.map((pkg: string) => ({
        paths: './src/main/java/**/*.{java,kt}',
        find: new RegExp(`import (static |)${escapeRegExp(pkg)}`, 'g'),
        replaceWith: `import $1${abiVersion}.${pkg}`,
      })),
      //This approach would be safer, but I don't think it's necessary
      //...packagesToKeep.map((pkg: string) => ({
      //  paths: './src/main/java/**/*.{java,kt}',
      //  find: new RegExp(`temporarydonotversion\\\.${escapeRegExp(pkg)}`, 'g'),
      //  replaceWith: pkg,
      //})),
      {
        paths: [`./src/main/java/**/*.{java,kt}`],
        find: /temporarydonotversion\./g,
        replaceWith: '',
      },
    ],
  };

  const files = await searchFilesAsync(sourceDirectory, [
    './build.gradle',
    './CMakeLists.txt',
    './empty.cpp',
    './src/main/AndroidManifest.xml',
    './src/main/cpp/**',
    './src/main/JNI/**',
    './src/main/Common/**',
    './src/main/java/versioned/**',
    './src/main/java/com/**',
  ]);

  for (const sourceFile of files) {
    await copyFileWithTransformsAsync({
      sourceFile,
      targetDirectory,
      sourceDirectory,
      transforms,
    });
  }

  const settingsGradlePath = path.join(androidDir, 'settings.gradle');
  const settingsGradle = await fs.readFile(settingsGradlePath, 'utf-8');
  if (!settingsGradle.match(abiVersion)) {
    await fs.writeFile(
      settingsGradlePath,
      settingsGradle.replace(
        /ADD_NEW_SUPPORTED_ABIS_HERE/,
        `ADD_NEW_SUPPORTED_ABIS_HERE\n    "${abiVersion}",`
      )
    );
  }
}
