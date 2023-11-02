/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { transformFromAstSync, traverse } from '@babel/core';
import { isJscSafeUrl, toNormalUrl } from 'jsc-safe-url';
import { Module, MixedOutput } from 'metro';
import baseJSBundle from 'metro/src/DeltaBundler/Serializers/baseJSBundle';
// @ts-expect-error
import sourceMapString from 'metro/src/DeltaBundler/Serializers/sourceMapString';
import bundleToString from 'metro/src/lib/bundleToString';
import { InputConfigT, SerializerConfigT } from 'metro-config';
import path from 'path';

import { toFixture } from './__tests__/fixtures/toFixture';
import {
  serverPreludeSerializerPlugin,
  environmentVariableSerializerPlugin,
} from './environmentVariableSerializerPlugin';
import { fileNameFromContents, getCssSerialAssets } from './getCssDeps';
import { SerialAsset } from './serializerAssets';
import { env } from '../env';

const countLines = require('metro/src/lib/countLines');
import { MetroSourceMapSegmentTuple, functionMapBabelPlugin } from 'metro-source-map';
import * as babylon from '@babel/parser';

export type Serializer = NonNullable<SerializerConfigT['customSerializer']>;

export type SerializerParameters = Parameters<Serializer>;

// A serializer that processes the input and returns a modified version.
// Unlike a serializer, these can be chained together.
export type SerializerPlugin = (...props: SerializerParameters) => SerializerParameters;

export function withExpoSerializers(config: InputConfigT): InputConfigT {
  const processors: SerializerPlugin[] = [];
  processors.push(serverPreludeSerializerPlugin);
  if (!env.EXPO_NO_CLIENT_ENV_VARS) {
    processors.push(environmentVariableSerializerPlugin);
  }

  return withSerializerPlugins(config, processors);
}

// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
export function withSerializerPlugins(
  config: InputConfigT,
  processors: SerializerPlugin[]
): InputConfigT {
  const originalSerializer = config.serializer?.customSerializer;

  return {
    ...config,
    serializer: {
      ...config.serializer,
      customSerializer: createSerializerFromSerialProcessors(processors, originalSerializer),
    },
  };
}
const JsFileWrapping = require('metro/src/ModuleGraph/worker/JsFileWrapping');
const generateImportNames = require('metro/src/ModuleGraph/worker/generateImportNames');

const inspect = (...props) =>
  console.log(...props.map((prop) => require('util').inspect(prop, { depth: 20, colors: true })));

export function getDefaultSerializer(fallbackSerializer?: Serializer | null): Serializer {
  const defaultSerializer =
    fallbackSerializer ??
    (async (...params: SerializerParameters) => {
      const bundle = baseJSBundle(...params);
      const outputCode = bundleToString(bundle).code;
      return outputCode;
    });
  return async (
    ...props: SerializerParameters
  ): Promise<string | { code: string; map: string }> => {
    const [entryPoint, preModules, graph, options] = props;

    // toFixture(...props);

    // TODO: When we can reuse transformJS for JSON, we should not derive `minify` separately.
    const minify =
      graph.transformOptions.minify &&
      graph.transformOptions.unstable_transformProfile !== 'hermes-canary' &&
      graph.transformOptions.unstable_transformProfile !== 'hermes-stable';

    // This pass will parse all modules back to AST and include the import/export statements.
    for (const value of graph.dependencies.values()) {
      function getGraphId(moduleId: string) {
        const key = [...value.dependencies.values()].find((dep) => {
          return dep.data.name === moduleId;
        })?.absolutePath;

        if (!key) {
          throw new Error(
            `Failed to find graph key for import "${moduleId}" in module "${value.path}"`
          );
        }
        return key;
      }
      for (const index in value.output) {
        const outputItem = value.output[index];

        const ast = babylon.parse(outputItem.data.code, { sourceType: 'unambiguous' });

        outputItem.data.ast = ast;
        outputItem.data.modules = {
          imports: [],
          exports: [],
        };

        traverse(ast, {
          // Traverse and collect import/export statements.
          ImportDeclaration(path) {
            const source = path.node.source.value;
            const specifiers = path.node.specifiers.map((specifier) => {
              return {
                type: specifier.type,
                importedName: specifier.type === 'ImportSpecifier' ? specifier.imported.name : null,
                localName: specifier.local.name,
              };
            });

            outputItem.data.modules.imports.push({
              source,
              key: getGraphId(source),
              specifiers,
            });
          },
        });
      }
    }

    // This pass will annotate the AST with the used and unused exports.
    for (const [depId, value] of graph.dependencies.entries()) {
      const inverseDeps = [...value.inverseDependencies.values()].map((id) => {
        return graph.dependencies.get(id);
      });

      const isExportUsed = (importName: string) => {
        return inverseDeps.some((dep) => {
          return dep?.output.some((outputItem) => {
            if (outputItem.type === 'js/module') {
              const imports = outputItem.data.modules?.imports;
              if (imports) {
                return imports.some((importItem) => {
                  return (
                    importItem.key === depId &&
                    importItem.specifiers.some((specifier) => {
                      return specifier.importedName === importName;
                    })
                  );
                });
              }
            }
            return false;
          });
        });
      };

      for (const index in value.output) {
        const outputItem = value.output[index];

        const ast = outputItem.data.ast;

        const annotate = false;

        // Traverse exports and mark them as used or unused based on if inverse dependencies are importing them.
        traverse(ast, {
          ExportNamedDeclaration(path) {
            function markUnused(node) {
              if (annotate) {
                node.leadingComments = node.leadingComments ?? [];
                node.leadingComments.push({
                  type: 'CommentBlock',
                  value: ` unused export ${node.id.name} `,
                });
              } else {
                path.remove();
              }
            }

            const declaration = path.node.declaration;
            if (declaration) {
              if (declaration.type === 'VariableDeclaration') {
                declaration.declarations.forEach((decl) => {
                  if (decl.id.type === 'Identifier') {
                    if (!isExportUsed(decl.id.name)) {
                      markUnused(decl);
                    }
                  }
                });
              } else if (declaration.type === 'FunctionDeclaration') {
                if (!isExportUsed(declaration.id.name)) {
                  markUnused(declaration);
                }
              }
            }
          },
        });
      }
    }

    for (const value of graph.dependencies.values()) {
      console.log('inverseDependencies', value.inverseDependencies.values());

      for (const index in value.output) {
        const outputItem = value.output[index];
        inspect('ii', outputItem.data.modules.imports);
        // modules: {
        //   imports: [],
        //   exports: [
        //     { specifiers: [ 'add' ] },
        //     { specifiers: [ 'subtract' ] }
        //   ]
        // },

        const exports = outputItem.data.modules?.exports;
        const usedExports: string[] = [];
        // Collect a list of all the unused exports by traversing inverse
        // dependencies.
        // for (const inverseDepId of value.inverseDependencies.values()) {
        //   const inverseDep = graph.dependencies.get(inverseDepId);
        //   if (!inverseDep) {
        //     continue;
        //   }

        //   inverseDep.output.forEach((outputItem) => {
        //     if (outputItem.type === 'js/module') {
        //       // imports: [
        //       //   {
        //       //     source: './math',
        //       //     specifiers: [
        //       //       {
        //       //         type: 'ImportSpecifier',
        //       //         importedName: 'add',
        //       //         localName: 'add'
        //       //       }
        //       //     ]
        //       //   }
        //       // ],

        //       const imports = outputItem.data.modules?.imports;
        //       if (imports) {
        //         imports.forEach((importItem) => {
        //           console.log('importItem', importItem);
        //           // TODO: Use proper keys for identifying the import.
        //           if (
        //             // '/Users/evanbacon/Documents/GitHub/expo/apps/sandbox/math.js'
        //             value.path.includes(
        //               // './math'
        //               importItem.source.replace('./', '')
        //             )
        //           ) {
        //             importItem.specifiers.forEach((specifier) => {
        //               usedExports.push(specifier.importedName);
        //             });
        //           }
        //         });
        //       }
        //     }
        //   });

        //   // TODO: This probably breaks source maps.
        //   // const code = transformFromAstSync(value.output[index].data.ast);
        //   // replaceEnvironmentVariables(value.output[index].data.code, process.env);
        //   // value.output[index].data.code = code;
        // }

        // let ast = outputItem.data.ast!;
        let ast = outputItem.data.ast; //?? babylon.parse(outputItem.data.code, { sourceType: 'unambiguous' });

        // Remove the unused exports from the list of ast exports.
        if (usedExports.length > 0) {
          console.log('has used exports:', usedExports);
          traverse(ast, {
            ExportNamedDeclaration(path) {
              // If the export is not used, remove it.
              if (!usedExports.includes(path.node.declaration.id.name)) {
                console.log('drop export:', path.node.declaration.id.name, usedExports);
                path.remove();
                // TODO: Determine if additional code needs to be removed based on the export.
              }
            },
          });
        }
        const { importDefault, importAll } = generateImportNames(ast);

        const babelPluginOpts = {
          // ...options,
          inlineableCalls: [importDefault, importAll],
          importDefault,
          importAll,
        };

        ast = transformFromAstSync(ast, undefined, {
          ast: true,
          babelrc: false,
          code: false,
          configFile: false,
          comments: true,
          compact: false,

          filename: value.path,
          plugins: [
            functionMapBabelPlugin,
            [require('metro-transform-plugins/src/import-export-plugin'), babelPluginOpts],
            [require('metro-transform-plugins/src/inline-plugin'), babelPluginOpts],
          ],
          sourceMaps: false,
          // Not-Cloning the input AST here should be safe because other code paths above this call
          // are mutating the AST as well and no code is depending on the original AST.
          // However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
          // either because one of the plugins is doing something funky or Babel messes up some caches.
          // Make sure to test the above mentioned case before flipping the flag back to false.
          cloneInputAst: true,
        })?.ast!;

        const dependencyMapName = '';
        const globalPrefix = '';

        const { ast: wrappedAst } = JsFileWrapping.wrapModule(
          ast,
          importDefault,
          importAll,
          dependencyMapName,
          globalPrefix
        );

        const outputCode = transformFromAstSync(wrappedAst, undefined, {
          ast: false,
          babelrc: false,
          code: true,
          configFile: false,
          // comments: false,
          // compact: true,
          comments: true,
          compact: false,
          filename: value.path,
          plugins: [],
          sourceMaps: false,
          // Not-Cloning the input AST here should be safe because other code paths above this call
          // are mutating the AST as well and no code is depending on the original AST.
          // However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
          // either because one of the plugins is doing something funky or Babel messes up some caches.
          // Make sure to test the above mentioned case before flipping the flag back to false.
          cloneInputAst: true,
        })!.code!;

        let map: Array<MetroSourceMapSegmentTuple> = [];

        if (minify) {
          // ({ map, code } = await minifyCode(
          //   config,
          //   projectRoot,
          //   file.filename,
          //   code,
          //   file.code,
          //   map
          // ));
        }

        outputItem.data.code = outputCode;
        outputItem.data.lineCount = countLines(outputItem.data.code);
        outputItem.data.map = map;
        outputItem.data.functionMap =
          ast.metadata?.metro?.functionMap ??
          // Fallback to deprecated explicitly-generated `functionMap`
          ast.functionMap ??
          null;
        // TODO: minify the code to fold anything that was dropped above.

        console.log('output code', outputItem.data.code);
      }
    }

    // console.log(
    //   require('util').inspect({ entryPoint, graph, options }, { depth: 20, colors: true })
    // );

    const jsCode = await defaultSerializer(entryPoint, preModules, graph, options);

    // console.log('OUTPUT CODE', jsCode);

    if (!options.sourceUrl) {
      return jsCode;
    }
    const sourceUrl = isJscSafeUrl(options.sourceUrl)
      ? toNormalUrl(options.sourceUrl)
      : options.sourceUrl;
    const url = new URL(sourceUrl, 'https://expo.dev');
    if (
      url.searchParams.get('platform') !== 'web' ||
      url.searchParams.get('serializer.output') !== 'static'
    ) {
      // Default behavior if `serializer.output=static` is not present in the URL.
      return jsCode;
    }

    const includeSourceMaps = url.searchParams.get('serializer.map') === 'true';

    const cssDeps = getCssSerialAssets<MixedOutput>(graph.dependencies, {
      projectRoot: options.projectRoot,
      processModuleFilter: options.processModuleFilter,
    });

    const jsAssets: SerialAsset[] = [];

    if (jsCode) {
      const stringContents = typeof jsCode === 'string' ? jsCode : jsCode.code;
      const jsFilename = fileNameFromContents({
        filepath: url.pathname,
        src: stringContents,
      });
      jsAssets.push({
        filename: options.dev ? 'index.js' : `_expo/static/js/web/${jsFilename}.js`,
        originFilename: 'index.js',
        type: 'js',
        metadata: {},
        source: stringContents,
      });

      if (
        // Only include the source map if the `options.sourceMapUrl` option is provided and we are exporting a static build.
        includeSourceMaps &&
        options.sourceMapUrl
      ) {
        const sourceMap = typeof jsCode === 'string' ? serializeToSourceMap(...props) : jsCode.map;

        // Make all paths relative to the server root to prevent the entire user filesystem from being exposed.
        const parsed = JSON.parse(sourceMap);
        // TODO: Maybe we can do this earlier.
        parsed.sources = parsed.sources.map(
          // TODO: Maybe basePath support
          (value: string) => {
            if (value.startsWith('/')) {
              return '/' + path.relative(options.serverRoot ?? options.projectRoot, value);
            }
            // Prevent `__prelude__` from being relative.
            return value;
          }
        );

        jsAssets.push({
          filename: options.dev ? 'index.map' : `_expo/static/js/web/${jsFilename}.js.map`,
          originFilename: 'index.map',
          type: 'map',
          metadata: {},
          source: JSON.stringify(parsed),
        });
      }
    }

    return JSON.stringify([...jsAssets, ...cssDeps]);
  };
}

function getSortedModules(
  graph: SerializerParameters[2],
  {
    createModuleId,
  }: {
    createModuleId: (path: string) => number;
  }
): readonly Module<any>[] {
  const modules = [...graph.dependencies.values()];
  // Assign IDs to modules in a consistent order
  for (const module of modules) {
    createModuleId(module.path);
  }
  // Sort by IDs
  return modules.sort(
    (a: Module<any>, b: Module<any>) => createModuleId(a.path) - createModuleId(b.path)
  );
}

function serializeToSourceMap(...props: SerializerParameters): string {
  const [, prepend, graph, options] = props;

  const modules = [
    ...prepend,
    ...getSortedModules(graph, {
      createModuleId: options.createModuleId,
    }),
  ];

  return sourceMapString(modules, {
    ...options,
  });
}

export function createSerializerFromSerialProcessors(
  processors: (SerializerPlugin | undefined)[],
  originalSerializer?: Serializer | null
): Serializer {
  const finalSerializer = getDefaultSerializer(originalSerializer);
  return (...props: SerializerParameters): ReturnType<Serializer> => {
    for (const processor of processors) {
      if (processor) {
        props = processor(...props);
      }
    }

    return finalSerializer(...props);
  };
}

export { SerialAsset };
