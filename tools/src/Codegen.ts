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
  type: 'components' | 'modules' | 'all';

  // platform for generated code
  platform: 'android' | 'ios';

  // absolute path to library's javascript code
  jsSrcsDir: string;

  // keep the intermediate schema.json (default is false)
  keepIntermediateSchema?: boolean;

  // java package name
  javaPackageName?: string;
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
  await fs.ensureDir(params.outputDir);

  // generate schema.json from js & flow types
  await spawnAsync('node', [genSchemaScript, schemaOutputPath, params.jsSrcsDir]);

  // generate code from schema.json
  const genCodeArgs = [
    genCodeScript,
    '--platform',
    params.platform,
    '--schemaPath',
    schemaOutputPath,
    '--outputDir',
    params.outputDir,
    '--libraryName',
    params.name,
    '--libraryType',
    params.type,
  ];
  if (params.javaPackageName) {
    genCodeArgs.push('--javaPackageName', params.javaPackageName);
  }
  await spawnAsync('node', genCodeArgs);

  const keepIntermediateSchema = params.keepIntermediateSchema ?? false;
  if (!keepIntermediateSchema) {
    await fs.remove(schemaOutputPath);
  }
}
