const { transform } = require('@expo/metro-swc-transformer');

const config = {
  //     assetPlugins: ReadonlyArray<string>;
  //   assetRegistryPath: string;
  //   asyncRequireModulePath: string;
  //   babelTransformerPath: string;
  //   dynamicDepsInPackages: DynamicRequiresBehavior;
  //   enableBabelRCLookup: boolean;
  //   enableBabelRuntime: boolean;
  //   globalPrefix: string;
  //   hermesParser: boolean;
  //   minifierConfig: MinifierConfig;
  //   minifierPath: string;
  //   optimizationSizeLimit: number;
  //   publicPath: string;
  //   allowOptionalDependencies: AllowOptionalDependencies;
  //   unstable_collectDependenciesPath: string;
  //   unstable_dependencyMapReservedName?: string;
  //   unstable_disableModuleWrapping: boolean;
  //   unstable_disableNormalizePseudoGlobals: boolean;
  //   unstable_compactOutput: boolean;
  //   /** Enable `require.context` statements which can be used to import multiple files in a directory. */
  //   unstable_allowRequireContext: boolean;
};

const fs = require('fs');
const path = require('path');
const projectRoot = '/';

const filename = './foobar-test.js';
const data = Buffer.from('console.log("hello world")');

// JsTransformOptions
const options = {};
console.log(
  transform(
    {
      code: fs.readFileSync(require.resolve('react-native'), 'utf-8'), // 'console.log("hello world")',
      fileName: filename,
      globalPrefix: 'global',
    },
    {}
    // {
    //   code: 'console.log("hello world")',
    //   file_name: filename,
    //   global_prefix: 'global',
    // }
    //     pub code: String,
    //   pub file_name: Option<String>,
    //   pub global_prefix: Option<String>,
  )
);
// console.log(transform(config, projectRoot, filename, data, options));
