import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import { copyFileWithTransformsAsync, transformFileAsync } from '../../Transforms';
import { searchFilesAsync } from '../../Utils';
import {
  codegenTransforms,
  hermesTransforms,
  reactNativeTransforms,
} from './reactNativeTransforms';

export async function updateVersionedReactNativeAsync(
  reactNativeSubmoduleRoot: string,
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
    path.join(androidDir, 'sdks/.hermesversion'),
    path.join(versionedReactNativeDir, 'sdks/.hermesversion')
  );

  // Run and version codegen
  const codegenOutputRoot = path.join(versionedReactNativeDir, 'codegen');
  const tmpCodegenOutputRoot = path.join(versionedReactNativeDir, 'codegen-tmp');
  try {
    await runReactNativeCodegenAndroidAsync(reactNativeSubmoduleRoot, tmpCodegenOutputRoot);
    await versionCodegenDirectoryAsync(tmpCodegenOutputRoot, codegenOutputRoot, abiVersion);
  } finally {
    await fs.remove(tmpCodegenOutputRoot);
  }

  // Copy and version ReactAndroid and ReactCommon
  await versionReactNativeAsync(androidDir, versionedReactNativeDir, abiVersion);

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

async function versionReactNativeAsync(
  androidDir: string,
  versionedReactNativeDir: string,
  abiVersion: string
) {
  const files = await searchFilesAsync(androidDir, ['./ReactAndroid/**', './ReactCommon/**']);
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
      sourceDirectory: androidDir,
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

async function runReactNativeCodegenAndroidAsync(
  reactNativeSubmoduleRoot: string,
  tmpCodegenOutputRoot: string
) {
  await fs.remove(tmpCodegenOutputRoot);
  await fs.ensureDir(tmpCodegenOutputRoot);

  // generate schema.json from js & flow types
  const genSchemaScript = path.join(
    reactNativeSubmoduleRoot,
    'packages',
    'react-native-codegen',
    'lib',
    'cli',
    'combine',
    'combine-js-to-schema-cli.js'
  );
  const schemaOutputPath = path.join(tmpCodegenOutputRoot, 'schema.json');
  const jsSourceRoot = path.join(reactNativeSubmoduleRoot, 'Libraries');
  await spawnAsync('yarn', ['node', genSchemaScript, schemaOutputPath, jsSourceRoot]);

  // generate code from schema.json
  const genCodeScript = path.join(reactNativeSubmoduleRoot, 'scripts', 'generate-specs-cli.js');
  await spawnAsync('yarn', [
    'node',
    genCodeScript,
    '--platform',
    'android',
    '--schemaPath',
    schemaOutputPath,
    '--outputDir',
    tmpCodegenOutputRoot,
    '--libraryName',
    'rncore',
    '--javaPackageName',
    'com.facebook.fbreact.specs',
  ]);
}
