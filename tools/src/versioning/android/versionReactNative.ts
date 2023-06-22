import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import { runReactNativeCodegenAsync } from '../../Codegen';
import { REACT_NATIVE_SUBMODULE_DIR, REACT_NATIVE_SUBMODULE_MONOREPO_ROOT } from '../../Constants';
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
  const versionedReactNativeMonorepoRoot = path.join(androidDir, 'versioned-react-native');
  const versionedReactNativeRoot = path.join(
    versionedReactNativeMonorepoRoot,
    'packages/react-native'
  );
  await Promise.all([fs.remove(path.join(versionedReactNativeMonorepoRoot, 'packages'))]);

  await fs.mkdirp(path.join(versionedReactNativeRoot, 'sdks'));
  await fs.copy(
    path.join(REACT_NATIVE_SUBMODULE_DIR, 'sdks/.hermesversion'),
    path.join(versionedReactNativeRoot, 'sdks/.hermesversion')
  );

  // Run and version codegen
  const codegenOutputRoot = path.join(versionedReactNativeRoot, 'codegen');
  const tmpCodegenOutputRoot = path.join(versionedReactNativeMonorepoRoot, 'codegen-tmp');
  try {
    await runReactNativeCodegenAsync({
      reactNativeRoot: REACT_NATIVE_SUBMODULE_DIR,
      codegenPkgRoot: path.join(
        REACT_NATIVE_SUBMODULE_MONOREPO_ROOT,
        'packages',
        'react-native-codegen'
      ),
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
  await versionReactNativeAsync(versionedReactNativeRoot, abiVersion);

  await versionHermesAsync(versionedReactNativeMonorepoRoot, abiVersion);
}

async function versionHermesAsync(versionedReactNativeMonorepoRoot: string, abiVersion: string) {
  await spawnAsync('./gradlew', [':packages:react-native:ReactAndroid:hermes-engine:unzipHermes'], {
    shell: true,
    cwd: versionedReactNativeMonorepoRoot,
    stdio: 'inherit',
  });
  await transformFileAsync(
    path.join(
      versionedReactNativeMonorepoRoot,
      'packages/react-native',
      'sdks/hermes/API/hermes/CMakeLists.txt'
    ),
    hermesTransforms(abiVersion)
  );
}

async function versionReactNativeAsync(versionedReactNativeRoot: string, abiVersion: string) {
  const files = await searchFilesAsync(REACT_NATIVE_SUBMODULE_DIR, [
    './ReactAndroid/**',
    './ReactCommon/**',
  ]);
  for (const file of files) {
    if ((file.match(/\/build\//) && !file.match(/src.*\/build\//)) || file.match(/\/\.cxx\//)) {
      files.delete(file);
    }
  }

  const transforms = reactNativeTransforms(versionedReactNativeRoot, abiVersion);
  for (const sourceFile of files) {
    await copyFileWithTransformsAsync({
      sourceFile,
      targetDirectory: versionedReactNativeRoot,
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
