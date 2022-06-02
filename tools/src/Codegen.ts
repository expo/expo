import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

export interface ReactNativeCodegenParameters {
  // path to `react-native` package
  reactNativeRoot: string;

  // path to `react-native-codegen` package
  codegenPkgRoot: string;

  // output path for generated code
  outputDir: string;

  // library name
  name: string;

  // library type
  type: 'components' | 'modules';

  // platform for generated code
  platform: 'android' | 'ios';

  // absolute path to library's javascript code
  jsSrcsDir: string;

  // keep the intermediate schema.json (default is false)
  keepIntermediateSchema?: boolean;

  // the base dir name for output generated code (default is `name`)
  outputDirBaseName?: string;
}

export async function runReactNativeCodegenAsync(params: ReactNativeCodegenParameters) {
  const genSchemaScript = path.join(
    params.codegenPkgRoot,
    'lib',
    'cli',
    'combine',
    'combine-js-to-schema-cli.js'
  );
  const genCodeScript = path.join(params.reactNativeRoot, 'scripts', 'generate-specs-cli.js');

  const schemaOutputPath = path.join(params.outputDir, 'schema.json');
  const outputDirBaseName = params.outputDirBaseName ?? params.name;
  const codegenOutputDir =
    params.type === 'components'
      ? path.join(params.outputDir, 'react', 'renderer', 'components', outputDirBaseName)
      : path.join(params.outputDir, outputDirBaseName);
  await fs.ensureDir(params.outputDir);

  // generate schema.json from js & flow types
  await spawnAsync('node', [genSchemaScript, schemaOutputPath, params.jsSrcsDir]);

  // generate code from schema.json
  await spawnAsync('node', [
    genCodeScript,
    '--platform',
    params.platform,
    '--schemaPath',
    schemaOutputPath,
    '--outputDir',
    codegenOutputDir,
    '--libraryName',
    params.name,
    '--libraryType',
    params.type,
  ]);

  const keepIntermediateSchema = params.keepIntermediateSchema ?? false;
  if (!keepIntermediateSchema) {
    await fs.remove(schemaOutputPath);
  }
}
