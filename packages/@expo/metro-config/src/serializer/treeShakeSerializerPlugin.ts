/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { transformFromAstSync, traverse } from '@babel/core';
import * as babylon from '@babel/parser';
import * as types from '@babel/types';
import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import type { DynamicRequiresBehavior } from 'metro/src/ModuleGraph/worker/collectDependencies';
import countLines from 'metro/src/lib/countLines';
import { InputConfigT, SerializerConfigT } from 'metro-config';
import { functionMapBabelPlugin, MetroSourceMapSegmentTuple } from 'metro-source-map';
import path from 'path';

import { hasSideEffect } from './sideEffectsSerializerPlugin';

export type Serializer = NonNullable<SerializerConfigT['customSerializer']>;

export type SerializerParameters = Parameters<Serializer>;
const generate = require('@babel/generator').default;

import { InvalidRequireCallError as InternalInvalidRequireCallError } from 'metro/src/ModuleGraph/worker/collectDependencies';

class InvalidRequireCallError extends Error {
  innerError: InternalInvalidRequireCallError;
  filename: string;

  constructor(innerError: InternalInvalidRequireCallError, filename: string) {
    super(`${filename}:${innerError.message}`);
    this.innerError = innerError;
    this.filename = filename;
  }
}

const JsFileWrapping = require('metro/src/ModuleGraph/worker/JsFileWrapping');
const collectDependencies = require('metro/src/ModuleGraph/worker/collectDependencies');
const generateImportNames = require('metro/src/ModuleGraph/worker/generateImportNames');
const inspect = (...props) =>
  console.log(...props.map((prop) => require('util').inspect(prop, { depth: 20, colors: true })));

type Ast = babylon.ParseResult<types.File>;

// Collect a list of exports that are not used within the module.
function findUnusedExports(ast: Ast) {
  const exportedIdentifiers = new Set<string>();
  const usedIdentifiers = new Set<string>();
  const unusedExports: string[] = [];

  // First pass: collect all export identifiers
  traverse(ast, {
    ExportNamedDeclaration(path) {
      const { declaration, specifiers } = path.node;
      if (declaration) {
        if (declaration.declarations) {
          declaration.declarations.forEach((decl) => {
            exportedIdentifiers.add(decl.id.name);
          });
        } else {
          exportedIdentifiers.add(declaration.id.name);
        }
      }
      specifiers.forEach((spec) => {
        exportedIdentifiers.add(spec.exported.name);
      });
    },

    ExportDefaultDeclaration(path) {
      // Default exports need to be handled separately
      // Assuming the default export is a function or class declaration:
      if (path.node.declaration.id) {
        exportedIdentifiers.add(path.node.declaration.id.name);
      }
    },
  });

  // Second pass: find all used identifiers
  traverse(ast, {
    Identifier(path) {
      if (path.isReferencedIdentifier()) {
        usedIdentifiers.add(path.node.name);
      }
    },
  });

  // Determine which exports are unused
  exportedIdentifiers.forEach((exported) => {
    if (!usedIdentifiers.has(exported)) {
      unusedExports.push(exported);
    }
  });

  return unusedExports;
}

const annotate = false;

export function treeShakeSerializerPlugin(config: InputConfigT) {
  return async function treeShakeSerializer(
    entryPoint: string,
    preModules: readonly Module<MixedOutput>[],
    graph: ReadOnlyGraph,
    options: SerializerOptions
  ): Promise<SerializerParameters> {
    // console.log('treeshake:', graph.transformOptions);
    if (!isShakingEnabled(graph, options)) {
      return [entryPoint, preModules, graph, options];
    }

    // Generate AST for all modules.
    graph.dependencies.forEach((value) => {
      value.output.forEach((output) => {
        if (
          output.type !== 'js/module' ||
          // This is a hack to prevent modules that are already wrapped from being included.
          output.data.code.startsWith('__d(function ')
        ) {
          return;
        }

        console.log('has ast:', !!output.data.ast);
        output.data.ast ??= babylon.parse(output.data.code, { sourceType: 'unambiguous' });
        output.data.modules = {
          imports: [],
          exports: [],
        };
      });
    });

    return [entryPoint, preModules, graph, options];

    function collectImportExports(value: Module<MixedOutput>) {
      function getGraphId(moduleId: string) {
        const key = [...value.dependencies.values()].find((dep) => {
          return dep.data.name === moduleId;
        })?.absolutePath;

        if (!key) {
          throw new Error(
            `Failed to find graph key for import "${moduleId}" in module "${
              value.path
            }". Options: ${[...value.dependencies.values()].map((v) => v.data.name)}`
          );
        }
        return key;
      }
      for (const index in value.output) {
        const outputItem = value.output[index];

        const ast = accessAst(outputItem);

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
          // Track require calls
          CallExpression(path) {
            if (path.node.callee.type === 'Identifier' && path.node.callee.name === 'require') {
              const arg = path.node.arguments[0];
              if (arg.type === 'StringLiteral') {
                outputItem.data.modules.imports.push({
                  source: arg.value,
                  key: getGraphId(arg.value),
                  specifiers: [],
                  cjs: true,
                });
              }
            }
          },
          // export from
          ExportNamedDeclaration(path) {
            if (path.node.source) {
              const source = path.node.source.value;
              const specifiers = path.node.specifiers.map((specifier) => {
                return {
                  type: specifier.type,
                  exportedName: specifier.exported.name,
                  localName: specifier.local.name,
                };
              });

              outputItem.data.modules.imports.push({
                source,
                key: getGraphId(source),
                specifiers,
              });
            }
          },
          // export * from
          ExportAllDeclaration(path) {
            if (path.node.source) {
              const source = path.node.source.value;

              outputItem.data.modules.imports.push({
                source,
                key: getGraphId(source),
                specifiers: [],
                star: true,
              });
            }
          },
        });
        // inspect('imports', outputItem.data.modules.imports);
      }
    }

    // const detectCommonJsExportsUsage = (ast: Parameters<typeof traverse>[0]): boolean => {
    //   let usesCommonJsExports = false;

    //   traverse(ast, {
    //     MemberExpression(path) {
    //       if (
    //         (path.node.object.name === 'module' && path.node.property.name === 'exports') ||
    //         path.node.object.name === 'exports'
    //       ) {
    //         usesCommonJsExports = true;
    //         console.log(`Found usage of ${path.node.object.name}.${path.node.property.name}`);
    //       }
    //     },
    //     CallExpression(path) {
    //       // Check for Object.assign or Object.defineProperties
    //       if (
    //         path.node.callee.type === 'MemberExpression' &&
    //         path.node.callee.object.name === 'Object' &&
    //         (path.node.callee.property.name === 'assign' ||
    //           path.node.callee.property.name === 'defineProperties')
    //       ) {
    //         // Check if the first argument is module.exports
    //         const firstArg = path.node.arguments[0];
    //         if (
    //           firstArg.type === 'MemberExpression' &&
    //           firstArg.object.name === 'module' &&
    //           firstArg.property.name === 'exports'
    //         ) {
    //           usesCommonJsExports = true;
    //         } else if (firstArg.type === 'Identifier' && firstArg.name === 'exports') {
    //           usesCommonJsExports = true;
    //         }
    //       }
    //     },
    //   });

    //   return usesCommonJsExports;
    // };

    function treeShakeExports(depId: string, value: Module<MixedOutput>) {
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
                  if (importItem.key !== depId) {
                    return false;
                  }
                  // If the import is CommonJS, then we can't tree-shake it.
                  if (importItem.cjs || importItem.star) {
                    return true;
                  }

                  return importItem.specifiers.some((specifier) => {
                    if (specifier.type === 'ImportDefaultSpecifier') {
                      return importName === 'default';
                    }
                    // Star imports are always used.
                    if (specifier.type === 'ImportNamespaceSpecifier') {
                      return true;
                    }
                    // `export { default as add } from './add'`
                    if (specifier.type === 'ExportSpecifier') {
                      return specifier.localName === importName;
                    }

                    return (
                      specifier.importedName === importName || specifier.exportedName === importName
                    );
                  });
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

        function markUnused(path, node) {
          if (annotate) {
            node.leadingComments = node.leadingComments ?? [];
            if (!node.leadingComments.some((comment) => comment.value.includes('unused export'))) {
              node.leadingComments.push({
                type: 'CommentBlock',
                value: ` unused export ${node.id.name} `,
              });
            }
          } else {
            path.remove();
          }
        }

        // Collect a list of exports that are not used within the module.
        const unusedExports = findUnusedExports(ast);

        // Traverse exports and mark them as used or unused based on if inverse dependencies are importing them.
        traverse(ast, {
          ExportDefaultDeclaration(path) {
            if (unusedExports.includes('default') && !isExportUsed('default')) {
              markUnused(path, path.node);
            }
          },

          ExportNamedDeclaration(path) {
            const declaration = path.node.declaration;
            if (declaration) {
              if (declaration.type === 'VariableDeclaration') {
                declaration.declarations.forEach((decl) => {
                  if (decl.id.type === 'Identifier') {
                    if (unusedExports.includes(decl.id.name) && !isExportUsed(decl.id.name)) {
                      markUnused(path, decl);
                    }
                  }
                });
              } else {
                // console.log(
                //   'check:',
                //   declaration.type,
                //   declaration.id?.name,
                //   isExportUsed(declaration.id.name),
                //   unusedExports
                // );
                // if (declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration')
                if (
                  unusedExports.includes(declaration.id.name) &&
                  !isExportUsed(declaration.id.name)
                ) {
                  markUnused(path, declaration);
                }
              }
            }
          },
        });
      }
    }

    function removeUnusedImports(value: Module<MixedOutput>, ast: Parameters<typeof traverse>[0]) {
      // Traverse imports and remove unused imports.

      // Keep track of all the imported identifiers
      const importedIdentifiers = new Set();

      // Keep track of all used identifiers
      const usedIdentifiers = new Set();

      traverse(ast, {
        ImportSpecifier(path) {
          importedIdentifiers.add(
            // Support `import { foo as bar } from './foo'`
            path.node.local.name ??
              // Support `import { foo } from './foo'`
              path.node.imported.name
          );
        },
        ImportDefaultSpecifier(path) {
          importedIdentifiers.add(path.node.local.name);
        },
        ImportNamespaceSpecifier(path) {
          importedIdentifiers.add(path.node.local.name);
        },
        Identifier(path) {
          // Make sure this identifier isn't coming from an import specifier
          if (path.findParent((path) => path.isImportSpecifier())) {
            return;
          }
          if (!path.scope.bindingIdentifierEquals(path.node.name, path.node)) {
            usedIdentifiers.add(path.node.name);
          }
        },
      });

      // Determine unused identifiers by subtracting the used from the imported
      const unusedImports = [...importedIdentifiers].filter(
        (identifier) => !usedIdentifiers.has(identifier)
      );

      // inspect(ast);
      let removed = false; //unusedImports.length > 0;
      // Remove the unused imports from the AST
      traverse(ast, {
        ImportDeclaration(path) {
          const originalSize = path.node.specifiers.length;
          path.node.specifiers = path.node.specifiers.filter((specifier) => {
            if (specifier.type === 'ImportDefaultSpecifier') {
              return !unusedImports.includes(specifier.local.name);
            } else if (specifier.type === 'ImportNamespaceSpecifier') {
              return !unusedImports.includes(specifier.local.name);
            } else {
              return !unusedImports.includes(specifier.imported.name);
            }
            // if (!specifier.imported) {
            // }
            // return !unusedImports.includes(specifier.imported.name);
          });
          if (originalSize !== path.node.specifiers.length) {
            removed = true;
          }

          // If no specifiers are left after filtering, remove the whole import declaration
          // e.g. `import './unused'` or `import {} from './unused'` -> remove.
          if (path.node.specifiers.length === 0) {
            // TODO: Ensure the module isn't side-effect-ful or importing a module that is side-effect-ful.
            const importModuleId = path.node.source.value;
            // Unlink the module in the graph
            const depId = [...value.dependencies.entries()].find(([key, dep]) => {
              return dep.data.name === importModuleId;
            })?.[0];

            // // Should never happen but we're playing with fire here.
            // if (!depId) {
            //   throw new Error(
            //     `Failed to find graph key for import "${importModuleId}" from "${importModuleId}" while optimizing ${
            //       value.path
            //     }. Options: ${[...value.dependencies.values()].map((v) => v.data.name)}`
            //   );
            // }

            // If the dependency was already removed, then we don't need to do anything.
            if (depId) {
              const dep = value.dependencies.get(depId)!;

              const graphDep = graph.dependencies.get(dep.absolutePath);
              // Should never happen but we're playing with fire here.
              if (!graphDep) {
                throw new Error(
                  `Failed to find graph key for import "${importModuleId}" while optimizing ${
                    value.path
                  }. Options: ${[...value.dependencies.values()].map((v) => v.data.name)}`
                );
              }

              // inspect(
              //   'remove',
              //   depId,
              //   dep.absolutePath,
              //   hasSideEffect(graphDep),
              //   isEmptyModule(graphDep)
              // );
              if (
                // Don't remove the module if it has side effects.
                !hasSideEffect(graph, graphDep) ||
                // Unless it's an empty module.
                isEmptyModule(graphDep)
              ) {
                // Remove inverse link to this dependency
                graphDep.inverseDependencies.delete(value.path);

                if (graphDep.inverseDependencies.size === 0) {
                  // Remove the dependency from the graph as no other modules are using it anymore.
                  graph.dependencies.delete(dep.absolutePath);
                }

                // Remove a random instance of the dep count to track if there are multiple imports.
                dep.data.data.locs.pop();

                if (!dep.data.data.locs.length) {
                  // Remove dependency from this module in the graph
                  value.dependencies.delete(depId);
                }

                // Delete the AST
                path.remove();

                // Mark the module as removed so we know to traverse again.
                removed = true;
              }
            } else {
              // TODO: I'm not sure what to do here?
              // Delete the AST
              // path.remove();
              // // Mark the module as removed so we know to traverse again.
              // removed = true;
            }
          }
        },
      });

      return removed;
    }

    function isEmptyModule(value: Module<MixedOutput>): boolean {
      function isASTEmptyOrContainsOnlyCommentsAndUseStrict(ast?: Ast) {
        if (!ast?.program.body.length) {
          return true;
        }

        let isEmptyOrCommentsAndUseStrict = true; // Assume true until proven otherwise

        traverse(ast, {
          enter(path) {
            const { node } = path;

            // If it's not a Directive, ExpressionStatement, or empty body,
            // it means we have actual code
            if (
              node.type !== 'Directive' &&
              node.type !== 'ExpressionStatement' &&
              !(node.type === 'Program' && node.body.length === 0)
            ) {
              isEmptyOrCommentsAndUseStrict = false;
              path.stop(); // No need to traverse further
              return;
            }

            // If it's an ExpressionStatement, check if it is "use strict"
            if (node.type === 'ExpressionStatement' && node.expression) {
              // Check if it's a Literal with value "use strict"
              const expression = node.expression;
              if (expression.type !== 'Literal' || expression.value !== 'use strict') {
                isEmptyOrCommentsAndUseStrict = false;
                path.stop(); // No need to traverse further
              }
            }
          },
          // If we encounter any non-comment nodes, it's not empty
          noScope: true,
        });

        return isEmptyOrCommentsAndUseStrict;
      }

      return value.output.every((outputItem) => {
        return isASTEmptyOrContainsOnlyCommentsAndUseStrict(accessAst(outputItem));
      });
    }

    function treeShakeAll(depth: number = 0) {
      if (depth > 10) {
        return;
      }
      // This pass will parse all modules back to AST and include the import/export statements.
      for (const value of graph.dependencies.values()) {
        collectImportExports(value);
      }

      // This pass will annotate the AST with the used and unused exports.
      for (const [depId, value] of graph.dependencies.entries()) {
        treeShakeExports(depId, value);

        value.output.forEach((outputItem) => {
          const ast = accessAst(outputItem);

          if (removeUnusedImports(value, ast)) {
            // TODO: haha this is slow
            treeShakeAll(depth + 1);
          }
        });
      }
    }

    // Tree shake the graph.
    treeShakeAll();

    return [entryPoint, preModules, graph, options];
  };
}

function accessAst(output: MixedOutput): Ast | undefined {
  // @ts-expect-error
  return output.data.ast;
}

export function isShakingEnabled(graph: ReadOnlyGraph, options: SerializerOptions) {
  return graph.transformOptions.customTransformOptions?.treeshake === 'true'; // && !options.dev;
}

export function createPostTreeShakeTransformSerializerPlugin(config: InputConfigT) {
  return async function treeShakeSerializer(
    entryPoint: string,
    preModules: readonly Module<MixedOutput>[],
    graph: ReadOnlyGraph,
    options: SerializerOptions
  ): Promise<SerializerParameters> {
    console.log('treeshake:', graph.transformOptions, isShakingEnabled(graph, options));
    if (!isShakingEnabled(graph, options)) {
      return [entryPoint, preModules, graph, options];
    }
    // return [entryPoint, preModules, graph, options];
    const includeDebugInfo = false;
    const preserveEsm = false;

    // TODO: When we can reuse transformJS for JSON, we should not derive `minify` separately.
    const minify =
      graph.transformOptions.minify &&
      graph.transformOptions.unstable_transformProfile !== 'hermes-canary' &&
      graph.transformOptions.unstable_transformProfile !== 'hermes-stable';

    const dynamicTransformOptions = await config.transformer?.getTransformOptions?.(
      [entryPoint],
      {
        dev: options.dev,
        hot: false,
        platform: graph.transformOptions.platform,
      },
      async (filepath) => {
        return [...(graph.dependencies.get(filepath)?.dependencies.keys() ?? [])];
      }
    );
    // Convert all remaining AST and dependencies to standard output that Metro expects.
    // This is normally done in the transformer, but we skipped it so we could perform graph analysis (tree-shake).
    for (const value of graph.dependencies.values()) {
      if (value.path.includes('empty-module.js')) {
        inspect(value);
      }
      for (const index in value.output) {
        const outputItem = value.output[index];
        let ast = accessAst(outputItem);
        if (!ast) {
          continue;
        }
        // TODO: Only transform if "type": "js/module",
        // NOTE: ^^ Only modules are being parsed to ast right now.

        delete outputItem.data.ast;

        const { importDefault, importAll } = generateImportNames(ast);

        const babelPluginOpts = {
          // ...options,
          ...graph.transformOptions,

          // inlinePlatform: true,
          // minify: false,
          // platform: 'web',

          // unstable_transformProfile: 'default',
          // experimentalImportSupport: false,
          // unstable_disableES6Transforms: false,
          // nonInlinedRequires: [ 'React', 'react', 'react-native' ],
          // type: 'module',
          // inlineRequires: false,
          inlineableCalls: [importDefault, importAll],
          importDefault,
          importAll,
        };

        ast = transformFromAstSync(ast, undefined, {
          ast: true,
          babelrc: false,
          code: false,
          configFile: false,
          // comments: includeDebugInfo,
          // compact: false,
          filename: value.path,
          plugins: [
            // functionMapBabelPlugin,
            !preserveEsm && [
              require('metro-transform-plugins/src/import-export-plugin'),
              babelPluginOpts,
            ],

            // TODO: Inline requires matchers
            // dynamicTransformOptions?.transform?.inlineRequires && [
            //   require('metro-transform-plugins/src/inline-plugin'),
            //   babelPluginOpts,
            // ],
          ].filter(Boolean),
          sourceMaps: false,
          // // Not-Cloning the input AST here should be safe because other code paths above this call
          // // are mutating the AST as well and no code is depending on the original AST.
          // // However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
          // // either because one of the plugins is doing something funky or Babel messes up some caches.
          // // Make sure to test the above mentioned case before flipping the flag back to false.
          // cloneInputAst: true,
        })?.ast!;

        let dependencyMapName = '';
        // This pass converts the modules to use the generated import names.
        try {
          const opts = {
            asyncRequireModulePath:
              config.transformer?.asyncRequireModulePath ??
              require.resolve('metro-runtime/src/modules/asyncRequire'),
            dependencyTransformer: undefined,
            dynamicRequires: getDynamicDepsBehavior(
              config.transformer?.dynamicDepsInPackages ?? 'throwAtRuntime',
              value.path
            ),
            inlineableCalls: [importDefault, importAll],
            keepRequireNames: options.dev,
            // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L132C32-L132C37
            allowOptionalDependencies: config.transformer?.allowOptionalDependencies ?? false,
            // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L134C46-L134C46
            dependencyMapName: config.transformer?.unstable_dependencyMapReservedName ?? null,
            // Expo sets this to `true`.
            unstable_allowRequireContext: config.transformer?.unstable_allowRequireContext,
          };

          ({ ast, dependencyMapName } = collectDependencies(ast, opts));
          // ({ ast, dependencies, dependencyMapName } = collectDependencies(ast, opts));
        } catch (error) {
          if (error instanceof InternalInvalidRequireCallError) {
            throw new InvalidRequireCallError(error, value.path);
          }
          throw error;
        }

        // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L107
        const globalPrefix = config.transformer?.globalPrefix ?? '';

        const { ast: wrappedAst } = JsFileWrapping.wrapModule(
          ast,
          importDefault,
          importAll,
          dependencyMapName,
          globalPrefix
        );

        const source = value.getSource().toString('utf-8');

        const reserved: string[] = [];
        if (config.transformer?.unstable_dependencyMapReservedName != null) {
          reserved.push(config.transformer.unstable_dependencyMapReservedName);
        }
        // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L128C28-L128C38
        const optimizationSizeLimit = config.transformer?.optimizationSizeLimit ?? 150 * 1024;
        if (
          minify &&
          source.length <= optimizationSizeLimit &&
          !config.transformer?.unstable_disableNormalizePseudoGlobals
        ) {
          // This MUST run before `generate` as it mutates the ast out of place.
          reserved.push(
            ...metroTransformPlugins.normalizePseudoGlobals(wrappedAst, {
              reservedNames: reserved,
            })
          );
        }

        const result = generate(
          wrappedAst,
          {
            // comments: true,
            // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L137
            compact: config.transformer?.unstable_compactOutput ?? false,
            filename: value.path,
            retainLines: false,
            sourceFileName: value.path,
            sourceMaps: true,
          },
          outputItem.data.code
        );

        let map = result.rawMappings ? result.rawMappings.map(toSegmentTuple) : [];
        let code = result.code;

        if (minify && !preserveEsm) {
          ({ map, code } = await minifyCode(
            config.transformer ?? {},
            config.projectRoot!,
            value.path,
            result.code,
            source,
            map,
            reserved
          ));
          // console.log('module', code);
        }

        outputItem.data.code = (includeDebugInfo ? `\n// ${value.path}\n` : '') + code;
        // @ts-expect-error
        outputItem.data.lineCount = countLines(outputItem.data.code);
        // @ts-expect-error
        outputItem.data.map = map;
        // @ts-expect-error
        outputItem.data.functionMap =
          // @ts-expect-error: https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-transform-worker/src/index.js#L508-L512
          ast.metadata?.metro?.functionMap ??
          // Fallback to deprecated explicitly-generated `functionMap`
          ast.functionMap ??
          null;

        // console.log('output code', outputItem.data.code);
      }
    }

    return [entryPoint, preModules, graph, options];
  };
}

function getDynamicDepsBehavior(
  inPackages: DynamicRequiresBehavior | undefined,
  filename: string
): DynamicRequiresBehavior {
  switch (inPackages) {
    case 'reject':
      return 'reject';
    case 'throwAtRuntime':
      const isPackage = /(?:^|[/\\])node_modules[/\\]/.test(filename);
      return isPackage ? inPackages : 'reject';
    default:
      throw new Error(`invalid value for dynamic deps behavior: \`${inPackages}\``);
  }
}

// TODO: Up-transform CJS to ESM
// https://github.com/vite-plugin/vite-plugin-commonjs/tree/main#cases
//
// const foo = require('foo').default
// ↓ ↓ ↓
// import foo from 'foo'
//
// const foo = require('foo')
// ↓ ↓ ↓
// import * as foo from 'foo'
//
// module.exports = { foo: 'bar' }
// ↓ ↓ ↓
// export const foo = 'bar'
//
// module.exports = { get foo() { return require('./foo') } }
// ↓ ↓ ↓
// export * as foo from './foo'
//

// Move requires out of conditionals if they don't contain side effects.

// TODO: Barrel reduction
//
// import { View, Image } from 'react-native';
// ↓ ↓ ↓
// import View from 'react-native/Libraries/Components/View/View';
// import Image from 'react-native/Libraries/Components/Image/Image';
//

// 1. For each import, recursively check if the module comes from a re-export.
// 2. Ensure each file in the re-export chain is not side-effect-ful.
// 3. Collapse the re-export chain into a single import.

// Check if "is re-export"
// 1. `export { default } from './foo'`
// 2. `export * from './foo'`
// 3. `export { default as foo } from './foo'`
// 4. `export { foo } from './foo'`
//
// Simplify:
// - Convert static cjs usage to esm.
// - Reduce `import { foo } from './foo'; export { foo }` to `export { foo } from './foo'`

// Test case: react native barrel reduction
// import warnOnce from './Libraries/Utilities/warnOnce';
// module.exports = {
//   get alpha() {
//     return require('./alpha')
//       .default;
//   },
//   get beta() {
//     return require('./beta').Beta;
//   },
//   get omega() {
//     return require('./omega');
//   },
//   get gamma() {
//     warnOnce(
//       'progress-bar-android-moved',
//       'ProgressBarAndroid has been extracted from react-native core and will be removed in a future release. ' +
//         "It can now be installed and imported from '@react-native-community/progress-bar-android' instead of 'react-native'. " +
//         'See https://github.com/react-native-progress-view/progress-bar-android',
//     );
//     return require('./gamma');
//   },
//   get delta() {
//     return () => console.warn('this is gone');
//   },
//   get zeta() {
//     console.error('do not use this');
//     return require('zeta').zeta;
//   },
// };

import { toSegmentTuple, toBabelSegments, fromRawMappings } from 'metro-source-map';

const getMinifier = require('metro-transform-worker/src/utils/getMinifier');

async function minifyCode(
  config: { minifierPath?: string; minifierConfig?: any },
  projectRoot: string,
  filename: string,
  code: string,
  source: string,
  map: Array<MetroSourceMapSegmentTuple>,
  reserved: readonly string[] = []
): Promise<{
  code: string;
  map: Array<MetroSourceMapSegmentTuple>;
}> {
  const sourceMap = fromRawMappings([
    {
      code,
      source,
      map,
      // functionMap is overridden by the serializer
      functionMap: null,
      path: filename,
      // isIgnored is overriden by the serializer
      isIgnored: false,
    },
  ]).toMap(undefined, {});

  // https://github.com/facebook/metro/blob/d1b0015d5a41ad1a1e1e78661805b692c34457db/packages/metro-config/src/defaults/defaults.js#L66
  const minify = getMinifier(config.minifierPath ?? 'metro-minify-terser');

  try {
    // console.log('reserved', reserved, code);

    const minified = await minify({
      code,
      map: sourceMap,
      filename,
      reserved,
      // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L109-L126
      config: config.minifierConfig ?? {
        mangle: {
          toplevel: false,
        },
        output: {
          ascii_only: true,
          quote_style: 3,
          wrap_iife: true,
        },
        sourceMap: {
          includeSources: false,
        },
        toplevel: false,
        compress: {
          // reduce_funcs inlines single-use functions, which cause perf regressions.
          reduce_funcs: false,
        },
      },
    });

    return {
      code: minified.code,
      map: minified.map ? toBabelSegments(minified.map).map(toSegmentTuple) : [],
    };
  } catch (error: any) {
    if (error.constructor.name === 'JS_Parse_Error') {
      throw new Error(`${error.message} in file ${filename} at ${error.line}:${error.col}`);
    }

    throw error;
  }
}

const metroTransformPlugins = require('metro-transform-plugins');
