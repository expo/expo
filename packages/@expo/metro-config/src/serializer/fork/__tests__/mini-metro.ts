import * as babel from '@babel/core';
import { Dependency, Module } from 'metro';
import CountingSet from 'metro/src/lib/CountingSet';
import countLines from 'metro/src/lib/countLines';
import collectDependencies from 'metro/src/ModuleGraph/worker/collectDependencies';
import * as path from 'path';

export const projectRoot = '/app/';

function toDependencyMap(...deps: Dependency[]): Map<string, Dependency> {
  const map = new Map();

  for (const dep of deps) {
    map.set(dep.data.data.key ?? dep.absolutePath, dep);
  }

  return map;
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
