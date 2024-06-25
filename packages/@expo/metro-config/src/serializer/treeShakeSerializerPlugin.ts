/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { NodePath, traverse } from '@babel/core';
import * as babylon from '@babel/parser';
import * as types from '@babel/types';
import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import { InputConfigT, SerializerConfigT } from 'metro-config';

import { hasSideEffectWithDebugTrace } from './sideEffectsSerializerPlugin';

const debug = require('debug')('expo:treeshaking') as typeof console.log;

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

export type Serializer = NonNullable<SerializerConfigT['customSerializer']>;

export type SerializerParameters = Parameters<Serializer>;
const generate = require('@babel/generator').default;

const inspect = (...props) =>
  console.log(...props.map((prop) => require('util').inspect(prop, { depth: 20, colors: true })));

type Ast = babylon.ParseResult<types.File>;

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

// Collect a list of exports that are not used within the module.
function getExportsThatAreNotUsedInModule(ast: Ast) {
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
        // console.log('referenced:', path.node.name);
        usedIdentifiers.add(path.node.name);
      }
    },
  });

  // console.log('exported:', exportedIdentifiers, 'used:', usedIdentifiers);
  // Determine which exports are unused
  exportedIdentifiers.forEach((exported) => {
    if (!usedIdentifiers.has(exported)) {
      unusedExports.push(exported);
    }
  });

  return unusedExports;
}

const annotate = false;

const optimizeAll = true;

function ensureConstantModuleOrder(graph: ReadOnlyGraph, options: SerializerOptions) {
  const modules = [...graph.dependencies.values()];
  // Assign IDs to modules in a consistent order before changing anything.
  // This is because Metro defaults to a non-deterministic order.
  // We need to ensure a deterministic order before changing the graph, otherwise the output bundle will be corrupt.
  for (const module of modules) {
    options.createModuleId(module.path);
  }
}

function populateGraphWithAst(graph: ReadOnlyGraph) {
  // Generate AST for all modules.
  graph.dependencies.forEach((value) => {
    if (
      // No tree shaking needed for JSON files.
      value.path.endsWith('.json')
    ) {
      return;
    }
    value.output.forEach((output) => {
      if (output.type !== 'js/module') {
        return;
      }
      if (
        // This is a hack to prevent modules that are already wrapped from being included.
        output.data.code.startsWith('__d(function ')
      ) {
        // TODO: This should probably assert.
        debug('Skipping tree-shake for wrapped module: ' + value.path);
        return;
      }

      // console.log('has ast:', !!output.data.ast, output.data.code);
      output.data.ast ??= babylon.parse(output.data.code, { sourceType: 'unambiguous' });
      output.data.modules = {
        imports: [],
        exports: [],
      };
    });
  });
}

function updateImportsForModule(value: Module<MixedOutput>) {
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
    if (!outputItem.data.modules) {
      outputItem.data.modules = {
        imports: [],
      };
    }

    outputItem.data.modules.imports = [];
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
          // path,
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
        // Async import calls
        if (path.node.callee.type === 'Import') {
          const arg = path.node.arguments[0];
          if (arg.type === 'StringLiteral') {
            outputItem.data.modules.imports.push({
              source: arg.value,
              key: getGraphId(arg.value),
              specifiers: [],
              async: true,
            });
          }
        }
        // require.resolveWeak calls
        if (
          path.node.callee.type === 'MemberExpression' &&
          path.node.callee.object.type === 'Identifier' &&
          path.node.callee.object.name === 'require' &&
          path.node.callee.property.type === 'Identifier' &&
          path.node.callee.property.name === 'resolveWeak'
        ) {
          const arg = path.node.arguments[0];
          if (arg.type === 'StringLiteral') {
            outputItem.data.modules.imports.push({
              source: arg.value,
              key: getGraphId(arg.value),
              specifiers: [],
              weak: true,
            });
          }
        }
        // TODO: Maybe also add require.context.
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

const markUnused = (path: NodePath, node) => {
  if (annotate) {
    node.leadingComments = node.leadingComments ?? [];
    if (!node.leadingComments.some((comment) => comment.value.includes('unused export'))) {
      node.leadingComments.push({
        type: 'CommentBlock',
        value: ` unused export ${node.id.name} `,
      });
    }
  } else {
    console.log('remove:', node.id?.name ?? node.exported?.name);
    path.remove();
  }
};

export function treeShakeSerializerPlugin(config: InputConfigT) {
  return async function treeShakeSerializer(
    entryPoint: string,
    preModules: readonly Module<MixedOutput>[],
    graph: ReadOnlyGraph,
    options: SerializerOptions
  ): Promise<SerializerParameters> {
    if (!isShakingEnabled(graph, options)) {
      return [entryPoint, preModules, graph, options];
    }

    // ensureConstantModuleOrder(graph, options);

    // Generate AST for all modules.
    populateGraphWithAst(graph);

    if (!optimizeAll) {
      // Useful for testing the transform reconciler...
      return [entryPoint, preModules, graph, options];
    }

    function disposeOfGraphNode(nodePath: string) {
      const node = graph.dependencies.get(nodePath);
      if (!node) return;
      // Recursively remove all dependencies.
      for (const dep of node.dependencies.values()) {
        const child = graph.dependencies.get(dep.absolutePath);
        if (!child) continue;

        // Remove inverse dependency on the node we're about to delete.
        child.inverseDependencies.delete(nodePath);
        // If the child has no more dependencies, then remove it from the graph too.
        if (child.inverseDependencies.size === 0) {
          disposeOfGraphNode(dep.absolutePath);
        }
      }
      // @ts-expect-error
      graph.dependencies.delete(nodePath);
    }

    function disconnectGraphNode(
      graphModule: Module<MixedOutput>,
      importModuleId: string
    ): boolean {
      // Unlink the module in the graph

      // The hash key for the dependency instance in the module.
      const depId = [...graphModule.dependencies.entries()].find(([key, dep]) => {
        return dep.data.name === importModuleId;
      })?.[0];

      // // Should never happen but we're playing with fire here.
      if (!depId) {
        throw new Error(
          `Failed to find graph key for import "${importModuleId}" from "${importModuleId}" while optimizing ${
            graphModule.path
          }. Options: ${[...graphModule.dependencies.values()].map((v) => v.data.name)}`
        );
      }

      // If the dependency was already removed, then we don't need to do anything.

      const importInstance = graphModule.dependencies.get(depId)!;

      // console.log('Try unlink:', importModuleId, dep);
      const graphEntryForTargetImport = graph.dependencies.get(importInstance.absolutePath);
      // Should never happen but we're playing with fire here.
      if (!graphEntryForTargetImport) {
        throw new Error(
          `Failed to find graph key for re-export "${importModuleId}" while optimizing ${
            graphModule.path
          }. Options: ${[...graphModule.dependencies.values()].map((v) => v.data.name)}`
        );
      }

      const [isFx, trace] = hasSideEffectWithDebugTrace(options, graph, graphEntryForTargetImport);
      if (
        // Don't remove the module if it has side effects.
        !isFx ||
        // Unless it's an empty module.
        isEmptyModule(graphEntryForTargetImport)
      ) {
        console.log('Drop', importInstance.absolutePath);

        // console.log('Drop module:', [...graphEntryForTargetImport.inverseDependencies.keys()]);
        // Remove inverse link to this dependency
        graphEntryForTargetImport.inverseDependencies.delete(graphModule.path);

        if (graphEntryForTargetImport.inverseDependencies.size === 0) {
          console.log('Unlink module from graph:', importInstance.absolutePath);
          // Remove the dependency from the graph as no other modules are using it anymore.
          disposeOfGraphNode(importInstance.absolutePath);
        }

        // Remove a random instance of the dep count to track if there are multiple imports.
        // TODO: Get the exact instance of the import.
        // console.log('importInstance.data.data', importInstance.data.data);
        importInstance.data.data.locs.pop();

        if (importInstance.data.data.locs.length === 0) {
          console.log('Remove import instance:', depId);
          // Remove dependency from this module so it doesn't appear in the dependency map.
          graphModule.dependencies.delete(depId);
        }

        // Mark the module as removed so we know to traverse again.
        return true;
      } else {
        if (isFx) {
          console.log('Skip graph unlinking due to side-effect trace:', trace.join(' > '));
        } else {
          console.log('Skip graph unlinking:', {
            depId,
            isFx,
          });
        }
      }

      return false;
    }

    function treeShakeExports(depId: string, value: Module<MixedOutput>) {
      let dirtyImports = false;
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
                  if (importItem.cjs || importItem.star || importItem.async) {
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

        // Collect a list of exports that are not used within the module.
        const possibleUnusedExports = getExportsThatAreNotUsedInModule(ast);
        // Traverse exports and mark them as used or unused based on if inverse dependencies are importing them.
        traverse(ast, {
          ExportDefaultDeclaration(path) {
            if (possibleUnusedExports.includes('default') && !isExportUsed('default')) {
              markUnused(path, path.node);
            }
          },

          // Account for `export { foo as bar };`
          ExportSpecifier(path) {
            // Ensure the check isn't `export {} from '...'` since we handle that separately.
            // if (path.parent.source) {
            //   return;
            // }
            // Ensure the local node isn't used in the module.
            if (types.isIdentifier(path.node.local)) {
              const internalName = path.node.local.name;

              if (
                types.isIdentifier(path.node.exported) &&
                possibleUnusedExports.includes(path.node.exported.name) &&
                !isExportUsed(path.node.exported.name)
              ) {
                markUnused(path, path.node);
              }
            }
          },

          ExportNamedDeclaration(path) {
            const declaration = path.node.declaration;

            // If empty, e.g. `export {} from '...'` then remove the whole statement.
            if (!declaration) {
              const importModuleId = path.node.source?.value;
              if (importModuleId && path.node.specifiers.length === 0) {
                if (disconnectGraphNode(value, importModuleId)) {
                  console.log(
                    'ExportNamedDeclaration: Disconnected:',
                    importModuleId,
                    'in:',
                    value.path
                  );
                  // dirtyImports = true;
                  markUnused(path, path.node.source);
                } else {
                  console.log(
                    'ExportNamedDeclaration: Cannot remove graph node for: ',
                    importModuleId,
                    'in:',
                    value.path
                  );
                }
              }
              return;
            }

            if (declaration) {
              // console.log('ExportNamedDeclaration: has dec: ', value.path);
              if (declaration.type === 'VariableDeclaration') {
                declaration.declarations.forEach((decl) => {
                  if (decl.id.type === 'Identifier') {
                    if (
                      possibleUnusedExports.includes(decl.id.name) &&
                      !isExportUsed(decl.id.name)
                    ) {
                      markUnused(path, decl);
                      console.log('mark remove.2:', decl.id.name, 'from:', value.path);
                    }
                  }
                });
              } else if ('id' in declaration && declaration.id && 'name' in declaration.id) {
                if (
                  possibleUnusedExports.includes(declaration.id.name) &&
                  !isExportUsed(declaration.id.name)
                ) {
                  console.log('mark remove:', declaration.id.name, 'from:', value.path);
                  markUnused(path, declaration);
                }
              }
            }
          },
        });
      }
      return dirtyImports;
    }

    function removeUnusedImports(value: Module<MixedOutput>, ast: Parameters<typeof traverse>[0]) {
      // Traverse imports and remove unused imports.

      // Keep track of all the imported identifiers
      const importedIdentifiers = new Set();

      // Keep track of all used identifiers
      const usedIdentifiers = new Set();

      // const importDecs: Array<NodePath<types.ImportDeclaration>> =
      //   value.output[0].data.modules?.imports.map((importItem) => importItem.path).filter(Boolean);
      const importDecs: Array<NodePath<types.ImportDeclaration>> = [];

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
        ImportDeclaration(path) {
          importDecs.push(path);
        },
      });

      let dirtyImports = false;

      if (!importDecs.length) {
        return dirtyImports;
      }

      // Determine unused identifiers by subtracting the used from the imported
      const unusedImports = [...importedIdentifiers].filter(
        (identifier) => !usedIdentifiers.has(identifier)
      );

      // Remove the unused imports from the AST
      importDecs.forEach((path, index) => {
        const originalSize = path.node.specifiers.length;
        path.node.specifiers = path.node.specifiers.filter((specifier) => {
          if (specifier.type === 'ImportDefaultSpecifier') {
            return !unusedImports.includes(specifier.local.name);
          } else if (specifier.type === 'ImportNamespaceSpecifier') {
            return !unusedImports.includes(specifier.local.name);
          } else {
            return !unusedImports.includes(specifier.imported.name);
          }
        });

        if (originalSize !== path.node.specifiers.length) {
          dirtyImports = true;
        }

        // If no specifiers are left after filtering, remove the whole import declaration
        // e.g. `import './unused'` or `import {} from './unused'` -> remove.
        if (path.node.specifiers.length === 0) {
          // TODO: Ensure the module isn't side-effect-ful or importing a module that is side-effect-ful.
          const importModuleId = path.node.source.value;

          if (disconnectGraphNode(value, importModuleId)) {
            console.log('Remove import:', importModuleId, 'from:', value.path);
            // Delete the import AST
            path.remove();
            dirtyImports = true;
            // Update crazy list
            // value.output[0].data.modules?.imports.splice(index, 1);
          }
        }
      });

      return dirtyImports;
    }

    // This pass will parse all modules back to AST and include the import/export statements.
    for (const value of graph.dependencies.values()) {
      updateImportsForModule(value);
    }

    function treeShakeAll(depth: number = 0) {
      if (depth > 5) {
        return;
      }

      // TODO: Add special handling for circular dependencies.

      // This pass will annotate the AST with the used and unused exports.
      for (const [depId, value] of graph.dependencies.entries()) {
        // Remove loose exports in a module
        if (treeShakeExports(depId, value)) {
          console.log('Re-run tree shake:', value.path);
          // TODO: haha this is slow
          return treeShakeAll(depth + 1);
        }

        value.output.forEach((outputItem) => {
          const ast = accessAst(outputItem);

          if (removeUnusedImports(value, ast)) {
            // If the imports changed, then recurse all the dependencies again to remove unused exports.
            // TODO: haha this is slow
            // TODO: Track the exact imports that were removed to exactly update the dependency exports.
            treeShakeAll(depth + 1);
          }
        });
      }
    }

    const beforeList = [...graph.dependencies.keys()];

    // Tree shake the graph.
    treeShakeAll();

    // Debug pass: Print all orphaned modules.
    for (const [depId, value] of graph.dependencies.entries()) {
      if (value.inverseDependencies.size === 0) {
        console.log('Orphan:', value.path);
      } else {
        let hasNormalNode = false;
        for (const dep of value.inverseDependencies) {
          if (!graph.dependencies.has(dep)) {
            console.log(
              `ISSUE: Dependency: ${value.path}, has inverse relation to missing node: ${dep}`
            );
          } else {
            hasNormalNode = true;
          }
        }
        if (!hasNormalNode) {
          console.log(`ERROR: All inverse dependencies are missing for: ${value.path}`);
          // TODO: Make this not happen ever
          graph.dependencies.delete(depId);
        }
      }
    }

    const afterList = [...graph.dependencies.keys()];
    // Print the removed modules:
    const removedModules = beforeList.filter((value) => !afterList.includes(value));
    console.log('Fully removed:', removedModules.sort());

    return [entryPoint, preModules, graph, options];
  };
}

export function printAst(ast: Ast) {
  console.log(generate(ast).code);
}

export function accessAst(output: MixedOutput): Ast | undefined {
  // @ts-expect-error
  return output.data.ast;
}

export function isShakingEnabled(graph: ReadOnlyGraph, options: SerializerOptions) {
  return String(graph.transformOptions.customTransformOptions?.treeshake) === 'true'; // && !options.dev;
}
