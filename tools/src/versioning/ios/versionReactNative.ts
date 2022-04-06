import fs from 'fs-extra';
import path from 'path';
import spawnAsync from '@expo/spawn-async';

import { IOS_DIR } from '../../Constants';

export async function runReactNativeCodegenAsync(
  reactNativeRoot: string,
  versionedReactNativeRoot: string,
  versionedName: string
): Promise<void> {
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
  const schemaOutputPath = path.join(versionedReactNativeRoot, 'codegen', 'schema.json');
  const codegenOutputDir = path.join(
    IOS_DIR,
    'build',
    versionedName,
    'generated',
    'ios',
    `${versionedName}FBReactNativeSpec`
  );
  const jsSourceRoot = path.join(reactNativeRoot, 'Libraries');
  await fs.ensureDir(path.dirname(schemaOutputPath));
  await spawnAsync('yarn', ['node', genSchemaScript, schemaOutputPath, jsSourceRoot]);

  // generate code from schema.json
  const genCodeScript = path.join(reactNativeRoot, 'scripts', 'generate-specs-cli.js');
  await spawnAsync('yarn', [
    'node',
    genCodeScript,
    '--platform',
    'ios',
    '--schemaPath',
    schemaOutputPath,
    '--outputDir',
    codegenOutputDir,
    '--libraryName',
    'FBReactNativeSpec',
    '--libraryType',
    'modules',
  ]);
}
