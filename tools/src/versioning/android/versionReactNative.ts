import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import { runReactNativeCodegenAsync } from '../../Codegen';
import { REACT_NATIVE_SUBMODULE_DIR } from '../../Constants';
import { copyFileWithTransformsAsync, transformFileAsync } from '../../Transforms';
import { searchFilesAsync } from '../../Utils';
import {
  codegenTransforms,
  hermesTransforms,
  reactNativeTransforms,
} from './reactNativeTransforms';

export async function updateVersionedReactNativeAsync(
  androidDir: string,
  sdkVersion: string
): Promise<void> {
  const abiVersion = `abi${sdkVersion.replace(/\./g, '_')}`;
  const versionedReactNativeDir = path.join(androidDir, 'versioned-react-native');
  await Promise.all([
    fs.remove(path.join(versionedReactNativeDir, 'ReactAndroid')),
    fs.remove(path.join(versionedReactNativeDir, 'ReactCommon')),
    fs.remove(path.join(versionedReactNativeDir, 'codegen')),
    fs.remove(path.join(versionedReactNativeDir, 'sdks')),
  ]);

  await fs.mkdirp(path.join(versionedReactNativeDir, 'sdks'));
  await fs.copy(
    path.join(REACT_NATIVE_SUBMODULE_DIR, 'sdks/.hermesversion'),
    path.join(versionedReactNativeDir, 'sdks/.hermesversion')
  );

  // Run and version codegen
  const codegenOutputRoot = path.join(versionedReactNativeDir, 'codegen');
  const tmpCodegenOutputRoot = path.join(versionedReactNativeDir, 'codegen-tmp');
  try {
    await runReactNativeCodegenAsync({
      reactNativeRoot: REACT_NATIVE_SUBMODULE_DIR,
      codegenPkgRoot: path.join(REACT_NATIVE_SUBMODULE_DIR, 'packages', 'react-native-codegen'),
      outputDir: tmpCodegenOutputRoot,
      name: 'rncore',
      platform: 'android',
      type: 'all',
      jsSrcsDir: path.join(REACT_NATIVE_SUBMODULE_DIR, 'Libraries'),
      javaPackageName: 'com.facebook.fbreact.specs',
    });
    await versionCodegenDirectoryAsync(tmpCodegenOutputRoot, codegenOutputRoot, abiVersion);
  } finally {
    await fs.remove(tmpCodegenOutputRoot);
  }

  // Copy and version ReactAndroid and ReactCommon
  await versionReactNativeAsync(versionedReactNativeDir, abiVersion);

  await versionHermesAsync(versionedReactNativeDir, abiVersion);
}

async function versionHermesAsync(versionedReactNativeDir: string, abiVersion: string) {
  await spawnAsync('./gradlew', [':ReactAndroid:hermes-engine:unzipHermes'], {
    shell: true,
    cwd: versionedReactNativeDir,
    stdio: 'inherit',
  });
  await transformFileAsync(
    path.join(versionedReactNativeDir, 'sdks/hermes/API/hermes/CMakeLists.txt'),
    hermesTransforms(abiVersion)
  );
}

async function versionReactNativeAsync(versionedReactNativeDir: string, abiVersion: string) {
  const files = await searchFilesAsync(REACT_NATIVE_SUBMODULE_DIR, [
    './ReactAndroid/**',
    './ReactCommon/**',
  ]);
  for (const file of files) {
    if ((file.match(/\/build\//) && !file.match(/src.*\/build\//)) || file.match(/\/\.cxx\//)) {
      files.delete(file);
    }
  }

  const transforms = reactNativeTransforms(versionedReactNativeDir, abiVersion);
  for (const sourceFile of files) {
    await copyFileWithTransformsAsync({
      sourceFile,
      targetDirectory: versionedReactNativeDir,
      sourceDirectory: REACT_NATIVE_SUBMODULE_DIR,
      transforms,
    });
  }
}

async function versionCodegenDirectoryAsync(
  tmpCodegenDir: string,
  codegenDir: string,
  abiVersion: string
) {
  const files = await searchFilesAsync(tmpCodegenDir, ['**']);
  const transforms = codegenTransforms(abiVersion);
  for (const sourceFile of files) {
    await copyFileWithTransformsAsync({
      sourceFile,
      targetDirectory: codegenDir,
      sourceDirectory: tmpCodegenDir,
      transforms,
    });
  }
}
