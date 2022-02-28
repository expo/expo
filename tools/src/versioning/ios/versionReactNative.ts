import fs from 'fs-extra';
import path from 'path';
import spawnAsync from '@expo/spawn-async';

export async function runReactNativeCodegenAsync(
  reactNativeRoot: string,
  versionedReactNativeRoot: string
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
    versionedReactNativeRoot,
    'React',
    'FBReactNativeSpec',
    'FBReactNativeSpec'
  );
  const jsSourceRoot = path.join(reactNativeRoot, 'Libraries');
  await fs.ensureDir(path.dirname(schemaOutputPath));
  await spawnAsync('yarn', ['node', genSchemaScript, schemaOutputPath, jsSourceRoot]);

  // generate code from schema.json
  const genCodeScript = path.join(reactNativeRoot, 'scripts', 'generate-specs-cli.js');
  await spawnAsync('yarn', [
    'node',
    genCodeScript,
    'ios',
    schemaOutputPath,
    codegenOutputDir,
    'FBReactNativeSpec',
  ]);
}
