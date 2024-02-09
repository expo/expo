import * as babel from '@babel/core';
import { Dependency, MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import collectDependencies from 'metro/src/ModuleGraph/worker/collectDependencies';
import CountingSet from 'metro/src/lib/CountingSet';
import countLines from 'metro/src/lib/countLines';
import * as path from 'path';

export const projectRoot = '/app/';

function toDependencyMap(...deps: Dependency[]): Map<string, Dependency> {
  const map = new Map();

  for (const dep of deps) {
    map.set(dep.data.data.key ?? dep.absolutePath, dep);
  }

  return map;
}

export function microBundle({
  fs,
  entry,
  resolve = (from, id) => {
    for (const ext of ['', '.js', '.ts', '.tsx']) {
      const next = path.join(path.dirname(from), id) + ext;
      if (fs[next]) {
        return next;
      }
    }
    if (id === 'expo-mock/async-require' && !fs['expo-mock/async-require']) {
      fs['expo-mock/async-require'] = `
                module.exports = () => 'MOCK'
            `;
      return 'expo-mock/async-require';
    }

    throw new Error(
      `Cannot resolve ${id} from ${from}. Available files: ${Object.keys(fs).join(', ')}`
    );
  },
  options = {},
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
    inlineSourceMaps?: boolean;
    hot?: boolean;
  };
}): [
  string,
  readonly Module<MixedOutput>[],
  ReadOnlyGraph<MixedOutput>,
  SerializerOptions<MixedOutput>,
] {
  if (!entry) {
    entry = Object.keys(fs).find((key) => key.match(/(\.\/)?index\.[tj]sx?/));
    if (!entry) {
      throw new Error(
        'No entrypoint found and cannot infer one from the mock fs: ' + Object.keys(fs).join(', ')
      );
    }
  }

  const modules = new Map<string, Module>();
  const visited = new Set<string>();

  function recurseWith(queue: string[], parent?: Module) {
    while (queue.length) {
      const id = queue.shift()!;
      const absPath = path.join(projectRoot, id);
      if (visited.has(absPath)) {
        modules.get(absPath)?.inverseDependencies.add(parent?.path);
        continue;
      }
      visited.add(absPath);
      const code = fs[id];
      if (!code) {
        throw new Error(`File not found: ${id}`);
      }
      const module = parseModule(id, code);
      modules.set(absPath, module);

      if (parent?.path) {
        module.inverseDependencies.add(parent.path);
      }

      // @ts-ignore
      for (const dep of module.dependencies.values()) {
        const resolved = resolve(id, dep.data.name);
        recurseWith([resolved], module);
      }
    }
  }
  recurseWith([entry]);

  const absEntry = path.join(projectRoot, entry);
  const dev = options.dev ?? true;
  return [
    // entryPoint: string,
    absEntry,
    // preModules: readonly Module<MixedOutput>[],
    [],
    // graph: ReadOnlyGraph<MixedOutput>,
    {
      dependencies: modules,
      entryPoints: new Set([absEntry]),
      transformOptions: {
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
        },
      },
    },
    // options: SerializerOptions<MixedOutput>
    {
      // @ts-ignore
      serializerOptions:
        options.output || options.hermes || options.sourceMaps
          ? {
              output: options.output,
              includeSourceMaps: options.sourceMaps,
            }
          : undefined,

      inlineSourceMap: options.inlineSourceMaps,
      sourceMapUrl: options.sourceMaps
        ? 'https://localhost:8081/indedx.bundle?dev=false'
        : undefined,
      asyncRequireModulePath: 'expo-mock/async-require',

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

// A small version of the Metro transformer to easily create dependency mocks from a string of code.
export function parseModule(
  relativeFilePath: string,
  code: string
): Module<{ type: string; data: { lineCount: number; code: string } }> {
  const absoluteFilePath = path.join(projectRoot, relativeFilePath);
  const filename = absoluteFilePath;

  let ast = babel.parseSync(code, {
    ast: true,
    babelrc: false,
    configFile: false,
    filename,
    code: false,
  });

  const generateImportNames = require('metro/src/ModuleGraph/worker/generateImportNames');
  const { importDefault, importAll } = generateImportNames(ast);
  const metroTransformPlugins = require('metro-transform-plugins');

  const babelPluginOpts = {
    // ...options,
    inlineableCalls: [importDefault, importAll],
    importDefault,
    importAll,
  };

  // @ts-ignore
  ast = babel.transformFromAstSync(ast, '', {
    ast: true,
    babelrc: false,
    code: false,
    configFile: false,
    comments: true,
    filename,
    plugins: [[metroTransformPlugins.importExportPlugin, babelPluginOpts]],
    sourceMaps: false,
    // Not-Cloning the input AST here should be safe because other code paths above this call
    // are mutating the AST as well and no code is depending on the original AST.
    // However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
    // either because one of the plugins is doing something funky or Babel messes up some caches.
    // Make sure to test the above mentioned case before flipping the flag back to false.
    cloneInputAst: true,
  }).ast!;

  const JsFileWrapping = require('metro/src/ModuleGraph/worker/JsFileWrapping');

  let dependencyMapName = null;
  let dependencies = null;
  ({ ast, dependencies, dependencyMapName } = collectDependencies(ast, {
    unstable_allowRequireContext: true,
    allowOptionalDependencies: true,
    asyncRequireModulePath: 'expo-mock/async-require',
    dynamicRequires: 'throwAtRuntime',
    inlineableCalls: [importDefault, importAll],
    keepRequireNames: true,
    dependencyTransformer: null,
    dependencyMapName: 'dependencyMap',
  }));

  ({ ast } = JsFileWrapping.wrapModule(ast, importDefault, importAll, dependencyMapName, ''));

  const output = babel.transformFromAstSync(ast, code, {
    code: true,
    ast: false,
    babelrc: false,
    configFile: false,
  }).code!;

  return {
    getSource() {
      return Buffer.from(code);
    },
    path: absoluteFilePath,
    dependencies: toDependencyMap(
      ...dependencies.map((dep) => ({
        absolutePath: mockAbsolutePath(dep.name),
        data: dep,
      }))
    ),
    inverseDependencies: new CountingSet(),
    output: [
      {
        data: {
          code: output,
          lineCount: countLines(output),
        },
        type: 'js/module',
      },
    ],
  };
}

function mockAbsolutePath(name: string) {
  if (name.match(/^(\.|\/)/)) {
    return path.join(projectRoot, name.replace(/\.[tj]sx?/, '')) + '.js';
  }
  return path.join(projectRoot, 'node_modules', name, 'index.js');
}
