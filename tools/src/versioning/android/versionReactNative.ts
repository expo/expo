import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import { transformFileAsync } from '../../Transforms';

export async function updateVersionedReactNativeAsync(
  reactNativeRoot: string,
  versionedReactNativeRoot: string
): Promise<void> {
  // Clone whole directories
  const copyDirs = ['ReactAndroid', 'ReactCommon'];
  await Promise.all(
    copyDirs.map((subdir) => fs.remove(path.join(versionedReactNativeRoot, subdir)))
  );
  await Promise.all(
    copyDirs.map((subdir) =>
      fs.copy(path.join(reactNativeRoot, subdir), path.join(versionedReactNativeRoot, subdir))
    )
  );

  // Run codegen
  const codegenOutputRoot = path.join(versionedReactNativeRoot, 'codegen');
  await fs.remove(codegenOutputRoot);
  await runReactNativeCodegenAndroidAsync(reactNativeRoot, codegenOutputRoot);

  // Patch ReactAndroid/build.gradle for codegen
  const buildGradlePath = path.join(versionedReactNativeRoot, 'ReactAndroid', 'build.gradle');
  await transformFileAsync(buildGradlePath, [
    // Update codegen folder to our customized folder
    {
      find: /"REACT_GENERATED_SRC_DIR=.+?",/,
      replaceWith: `"REACT_GENERATED_SRC_DIR=${versionedReactNativeRoot}",`,
    },
    // Add generated java to sourceSets
    {
      find: /(\bsrcDirs = \["src\/main\/java",.+)(])/,
      replaceWith: `$1, "${codegenOutputRoot}/java"$2`,
    },
    // Disable codegen plugin
    {
      find: /(\bid\("com\.facebook\.react\.codegen"\)$)/m,
      replaceWith: '// $1',
    },
    {
      find: /(^react {[^]+?\n\})/m,
      replaceWith: '/* $1 */',
    },
    {
      find: /(\bdependsOn\("generateCodegenArtifactsFromSchema"\))/,
      replaceWith: '// $1',
    },
  ]);
}

async function runReactNativeCodegenAndroidAsync(
  reactNativeRoot: string,
  codegenOutputRoot: string
) {
  await fs.ensureDir(codegenOutputRoot);

  // generate schema.json from js & flow types
  const genSchemaScript = path.join(
    reactNativeRoot,
    'packages',
    'react-native-codegen',
    'lib',
    'cli',
    'combine',
    'combine-js-to-schema-cli.js'
  );
  const schemaOutputPath = path.join(codegenOutputRoot, 'schema.json');
  const jsSourceRoot = path.join(reactNativeRoot, 'Libraries');
  await spawnAsync('yarn', ['node', genSchemaScript, schemaOutputPath, jsSourceRoot]);

  // generate code from schema.json
  const genCodeScript = path.join(reactNativeRoot, 'scripts', 'generate-specs-cli.js');
  await spawnAsync('yarn', [
    'node',
    genCodeScript,
    'android',
    schemaOutputPath,
    codegenOutputRoot,
    'ReactAndroidSpec',
    'com.facebook.fbreact.specs',
  ]);
}
