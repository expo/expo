import fs from 'fs-extra';
import path from 'path';

import { copyFileWithTransformsAsync } from '../../Transforms';
import { searchFilesAsync } from '../../Utils';
import { expoviewTransforms } from './transforms/expoviewTransforms';

export async function copyExpoviewAsync(sdkVersion: string, androidDir: string): Promise<void> {
  const abiVersion = `abi${sdkVersion.replace(/\./g, '_')}`;
  const targetDirectory = path.join(androidDir, `versioned-abis/expoview-${abiVersion}`);
  const sourceDirectory = path.join(androidDir, 'expoview');
  const transforms = expoviewTransforms(abiVersion);

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
  let settingsGradle = await fs.readFile(settingsGradlePath, 'utf-8');
  if (!settingsGradle.match(abiVersion)) {
    settingsGradle = settingsGradle.replace(
      /ADD_NEW_SUPPORTED_ABIS_HERE/,
      `ADD_NEW_SUPPORTED_ABIS_HERE\n    "${abiVersion}",`
    );
  }
  const vendoredLinking = `useVendoredModulesForSettingsGradle('sdk${sdkVersion.split('.')[0]}')`;
  if (!settingsGradle.match(vendoredLinking)) {
    settingsGradle = settingsGradle.replace(
      /(^useVendoredModulesForSettingsGradle\('unversioned'\))/gm,
      `$1\n${vendoredLinking}`
    );
  }

  await fs.writeFile(settingsGradlePath, settingsGradle);
}
