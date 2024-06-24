import * as babel from '@babel/core';
import * as types from '@babel/types';
import { Dependency, MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import collectDependencies from 'metro/src/ModuleGraph/worker/collectDependencies';
import CountingSet from 'metro/src/lib/CountingSet';
import countLines from 'metro/src/lib/countLines';
import * as path from 'path';

export const projectRoot = '/app';

function toDependencyMap(...deps: Dependency[]): Map<string, Dependency> {
  const map = new Map();

  for (const dep of deps) {
    map.set(dep.data.data.key ?? dep.absolutePath, dep);
  }

  return map;
}
import { type TransformInputOptions } from 'metro/src/DeltaBundler/types';

export async function microBundle({
  fs,
  entry,
  resolve = (from, id) => {
    const fullFs = {
      ...preModulesFs,
      ...fs,
    };
    for (const index of ['index', '']) {
      for (const ext of ['', '.js', '.ts', '.tsx']) {
        let next = path.join(path.dirname(from), id);
        if (index) {
          next = path.join(next, index);
        }
        next += ext;
        if (fullFs[next] != null) {
          return next;
        }
      }
    }
    if (id === 'expo-mock/async-require' && !fullFs['expo-mock/async-require']) {
      fullFs['expo-mock/async-require'] = `
                module.exports = () => 'MOCK'
            `;
      return 'expo-mock/async-require';
    }
    if (id === 'react-server-dom-webpack/server' && !fullFs['react-server-dom-webpack/server']) {
      fullFs['react-server-dom-webpack/server'] = `
                module.exports = () => 'MOCK'
            `;
      return 'react-server-dom-webpack/server';
    }

    throw new Error(
      `Cannot resolve ${id} from ${from}. Available files: ${Object.keys(fullFs).join(', ')}`
    );
  },
  options = {},
  preModulesFs = {},
}: {
  fs: Record<string, string>;
  entry?: string;
  resolve?: (from: string, id: string) => string;
  options?: {
    dev?: boolean;
    platform?: string;
    baseUrl?: string;
    output?: 'static';
    hermes?: boolean;
    sourceMaps?: boolean;
    sourceUrl?: string;
    isServer?: boolean;
    isReactServer?: boolean;
    inlineSourceMaps?: boolean;
    hot?: boolean;
    splitChunks?: boolean;
    treeshake?: boolean;
  };
  preModulesFs?: Record<string, string>;
}): Promise<[
  string,
  readonly Module<MixedOutput>[],
  ReadOnlyGraph<MixedOutput>,
  SerializerOptions<MixedOutput>,
]> {
  const fullFs = {
    'react-server-dom-webpack/server': ``,
    'expo-mock/async-require': `
    module.exports = () => 'MOCK'
`,
    ...preModulesFs,
    ...fs,
  };
  if (!entry) {
    entry = Object.keys(fullFs).find((key) => key.match(/(\.\/)?index\.[tj]sx?/));
    if (!entry) {
      throw new Error(
        'No entrypoint found and cannot infer one from the mock fs: ' +
          Object.keys(fullFs).join(', ')
      );
    }
  }

  const absEntry = path.join(projectRoot, entry);
  const dev = options.dev ?? true;
  const transformOptions: TransformInputOptions = {
    hot: options.hot ?? false,
    minify: false,
    dev,
    type: 'module',
    unstable_transformProfile: options.hermes ? 'hermes-stable' : 'default',
    platform: options.platform ?? 'web',
    customTransformOptions: {
      __proto__: null,
      bytecode: options.hermes,
      baseUrl: options.baseUrl,
      engine: options.hermes ? 'hermes' : undefined,
      environment: options.isReactServer ? 'react-server' : options.isServer ? 'node' : undefined,
      treeshake: options.treeshake,
    },

    // NOTE: This is non-standard but it provides a cleaner output
    experimentalImportSupport: true,
  };

  const modules = new Map<string, Module>();
  const visited = new Set<string>();

  const parsedPreModules = await Promise.all(Object.entries(preModulesFs).map(async ([id, code]) => await parseModule(id, code, transformOptions)));

  async function recurseWith(queue: string[], parent?: Module) {
    while (queue.length) {
      const id = queue.shift()!;
      const absPath = path.join(projectRoot, id);
      if (visited.has(absPath)) {
        modules.get(absPath)?.inverseDependencies.add(
          // @ts-expect-error
          parent?.path
        );
        continue;
      }
      visited.add(absPath);
      const code = fullFs[id];
      if (code == null) {
        throw new Error(`File not found: ${id}`);
      }
      const module = await parseModule(id, code, transformOptions);
      modules.set(absPath, module);

      if (parent?.path) {
        module.inverseDependencies.add(parent.path);
      }

      // @ts-ignore
      for (const dep of module.dependencies.values()) {
        if (dep.data.data.contextParams) {
          throw new Error(`mini-metro runner doesn't support require context (yet)`)
        }

        const resolved = resolve(id, dep.data.name);
        await recurseWith([resolved], module);
      }
    }
  }
  await recurseWith([entry]);




  return [
    // entryPoint: string,
    absEntry,
    // preModules: readonly Module<MixedOutput>[],
    parsedPreModules,
    // graph: ReadOnlyGraph<MixedOutput>,
    {
      dependencies: modules,
      entryPoints: new Set([absEntry]),
      transformOptions,
    },
    // options: SerializerOptions<MixedOutput>
    {
      // @ts-ignore
      serializerOptions:
        options.output || options.hermes || options.sourceMaps || options.splitChunks
          ? {
              output: options.output,
              includeSourceMaps: options.sourceMaps,
              splitChunks: options.splitChunks,
            }
          : undefined,

      inlineSourceMap: options.inlineSourceMaps,
      sourceMapUrl: options.sourceMaps
        ? 'https://localhost:8081/indedx.bundle?dev=false'
        : undefined,
      asyncRequireModulePath: 'expo-mock/async-require',

      sourceUrl: options.sourceUrl,
      createModuleId(filePath) {
        return filePath as unknown as number;
      },
      dev,
      getRunModuleStatement(moduleId) {
        return `TEST_RUN_MODULE(${JSON.stringify(moduleId)});`;
      },
      includeAsyncPaths: dev,
      shouldAddToIgnoreList(module) {
        return false;
      },
      modulesOnly: false,
      processModuleFilter(module) {
        return true;
      },
      projectRoot,
      runBeforeMainModule: [],
      runModule: true,
      serverRoot: projectRoot,
    },
  ];
}

const disabledDependencyTransformer = {
  transformSyncRequire: () => void 0,
  transformImportCall: () => void 0,
  transformPrefetch: () => void 0,
  transformIllegalDynamicRequire: () => void 0,
};

import * as expoMetroTransformWorker from '../../../transform-worker/transform-worker';

const METRO_CONFIG_DEFAULTS = require('metro-config/src/defaults/index').getDefaultValues() as import('metro-config').ConfigT;
// A small version of the Metro transformer to easily create dependency mocks from a string of code.
export async function parseModule(
  relativeFilePath: string,
  code: string,
  transformOptions: TransformInputOptions,
): Promise<Module<{ type: string; data: { lineCount: number; code: string } }>> {
  const absoluteFilePath = path.join(projectRoot, relativeFilePath);
  const filename = absoluteFilePath;

  console.log('Parsing module:', filename, code);
 
  const codeBuffer = Buffer.from(code);

  // TODO: Add a babel plugin which returns if the module has commonjs, and if so, disable all tree shaking optimizations early.

  const results = await expoMetroTransformWorker.transform(
    // config: JsTransformerConfig,
    {
      ...METRO_CONFIG_DEFAULTS.transformer,
      asyncRequireModulePath: 'expo-mock/async-require',
      unstable_allowRequireContext: true,
      allowOptionalDependencies: true,
      assetPlugins: [],
      babelTransformerPath: '@expo/metro-config/build/babel-transformer',
    },
    projectRoot,
    filename,
    codeBuffer,
    // options: JsTransformOptions
    {
      ...transformOptions,
       inlinePlatform: true, 
       inlineRequires: false,
    }
  );
  console.log(results);

  return {
    ...results,
    getSource() {
      return codeBuffer;
    },
    path: absoluteFilePath,
    dependencies: toDependencyMap(
      ...results.dependencies.map((dep) => ({
        absolutePath: mockAbsolutePath(
          dep.name
        ),
        data: dep,
      }))
    ),
    inverseDependencies: new CountingSet(),    
  }
  



  // // caller.treeshake = caller.treeshake ?? sourceType === 'module';
  // // Deterimine if the module is a CommonJS module or an ES module.

  // const generateImportNames = require('metro/src/ModuleGraph/worker/generateImportNames');
  // const { importDefault, importAll } = generateImportNames(ast);
  // const metroTransformPlugins = require('metro-transform-plugins');

  // const babelPluginOpts = {
  //   // ...options,
  //   inlineableCalls: [importDefault, importAll],
  //   importDefault,
  //   importAll,
  // };

  // // @ts-ignore
  // const file = babel.transformFromAstSync(ast, '', {
  //   ast: true,
  //   babelrc: false,
  //   code: false,
  //   configFile: false,
  //   comments: true,
  //   filename,
  //   plugins: [
  //     require('babel-preset-expo/build/client-module-proxy-plugin').reactClientReferencesPlugin,
  //     // TODO: We can probably just keep reference to the import/export names.
  //     caller.treeshake !== true && [metroTransformPlugins.importExportPlugin, babelPluginOpts],
  //   ].filter(Boolean),
  //   caller: {
  //     name: 'metro',
  //     serverRoot: projectRoot,
  //     ...caller,
  //   },
  //   sourceMaps: false,
  //   // Not-Cloning the input AST here should be safe because other code paths above this call
  //   // are mutating the AST as well and no code is depending on the original AST.
  //   // However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
  //   // either because one of the plugins is doing something funky or Babel messes up some caches.
  //   // Make sure to test the above mentioned case before flipping the flag back to false.
  //   cloneInputAst: true,
  // });

  // const unstable_disableModuleWrapping = caller.treeshake;
  // // @ts-ignore
  // ast = file?.ast!;

  // const JsFileWrapping = require('metro/src/ModuleGraph/worker/JsFileWrapping');

  // let dependencyMapName = null;
  // let dependencies: Dependency[] | null = null;
  // const options = {
  //   unstable_allowRequireContext: true,
  //   allowOptionalDependencies: true,
  //   asyncRequireModulePath: 'expo-mock/async-require',
  //   dynamicRequires: 'throwAtRuntime',
  //   inlineableCalls: [importDefault, importAll],
  //   keepRequireNames: true,
  //   dependencyMapName: 'dependencyMap',
  // };

  // // @ts-expect-error
  // ({ ast, dependencies, dependencyMapName } = collectDependencies(ast, {
  //   ...options,
  //   dependencyTransformer: unstable_disableModuleWrapping
  //     ? disabledDependencyTransformer
  //     : undefined,
  // }));

  // if (!dependencies) throw new Error('dependencies not found');

  // if (unstable_disableModuleWrapping) {
  // } else {
  //   ({ ast } = JsFileWrapping.wrapModule(ast, importDefault, importAll, dependencyMapName, ''));
  // }

  // const output = babel.transformFromAstSync(ast!, code, {
  //   code: true,
  //   ast: false,
  //   babelrc: false,
  //   configFile: false,
  // })!.code!;

  // return {
  //   getSource() {
  //     return Buffer.from(code);
  //   },
  //   path: absoluteFilePath,
  //   dependencies: toDependencyMap(
  //     // @ts-expect-error
  //     ...dependencies.map((dep) => ({
  //       absolutePath: mockAbsolutePath(
  //         // @ts-expect-error
  //         dep.name
  //       ),
  //       data: dep,
  //     }))
  //   ),
  //   inverseDependencies: new CountingSet(),
  //   output: [
  //     {
  //       data: {
  //         code: output,
  //         lineCount: countLines(output),
  //         // @ts-expect-error
  //         reactClientReference: file?.metadata?.reactClientReference,

  //         collectDependenciesOptions: options,
  //       },
  //       type: 'js/module',
  //     },
  //   ],
  // };
}

function mockAbsolutePath(name: string) {
  if (name.match(/^(\.|\/)/)) {
    return path.join(projectRoot, name.replace(/\.[tj]sx?/, '')) + '.js';
  }
  return path.join(projectRoot, 'node_modules', name, 'index.js');
}
