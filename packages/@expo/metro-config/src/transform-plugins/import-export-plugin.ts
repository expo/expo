/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// A fork of the upstream metro-babel-transform-plugin/import-export-plugin that uses Expo-specific features
// and adds support for export-namespace-from
// https://github.com/facebook/metro/blob/8e48aa823378962beccbe37d85f1aff2c34b28b1/packages/metro-transform-plugins/src/import-export-plugin.js

import { template } from '@babel/core';
import type { ConfigAPI, NodePath, PluginObj, types as t } from '@babel/core';
import assert from 'node:assert';
const debug = require('debug')('expo:metro-config:import-export-plugin') as typeof console.log;

function nullthrows<T>(x: T | null, message?: string): NonNullable<T> {
  assert(x != null, message);
  return x;
}

export type Options = Readonly<{
  importDefault: string;
  importAll: string;
  resolve: boolean;
  /** Whether to use live bindings for exports and import. Improves circular dependencies resolution. */
  liveBindings?: boolean;
  out?: {
    isESModule: boolean;
    [key: string]: unknown;
  };
}>;

class MapToArray<K, V> extends Map<K, V[]> {
  public getOrDefault(key: K): V[] {
    return this.get(key) ?? (this.set(key, []).get(key) as V[]);
  }
}

type State = {
  importDefault: t.Node;
  importAll: t.Node;
  opts: Options;
  [key: string]: unknown;
  originalImportOrder: Set<string>;
  exportAllFrom: Map<string, { loc: t.SourceLocation | null | undefined }>;
  importAllFromAs: MapToArray<string, { loc: t.SourceLocation | null | undefined; as: string }>;
  exportAllFromAs: MapToArray<string, { loc: t.SourceLocation | null | undefined; as: string }>;
  importDefaultFromAs: MapToArray<string, { loc: t.SourceLocation | null | undefined; as: string }>;
  exportDefault: { loc: t.SourceLocation | null | undefined; name: string }[];
  exportNamedFrom: MapToArray<
    string,
    { loc: t.SourceLocation | null | undefined; name: string; as: string }
  >;
  importNamedFrom: MapToArray<
    string,
    { loc: t.SourceLocation | null | undefined; name: string; as: string }
  >;
  exportNamed: { loc: t.SourceLocation | null | undefined; name: string; as: string }[];
  importedIdentifiers: MapToArray<string, { module: string; name: string }>;
  importSideEffect: Map<string, { loc: t.SourceLocation | null | undefined }>;
};

/**
 * Produces a Babel template that transforms an "import { x } from a" into
 * "var _a = require(a)" call which needs to be followed by
 * update of the "x" references to "_a.x".
 */
const requireTemplate = template.statement(`
  var LOCAL = require(FILE);
`);

/**
 * Produces a Babel template that transforms an "import * as x from ..." or an
 * "import x from ..." call into a "const x = importAll(...)" call with the
 * corresponding id in it.
 */
const importTemplate = template.statement(`
  var LOCAL = IMPORT(FILE);
`);

/**
 * Produces a Babel template that transforms an "import {x as y} from ..." into
 * "const y = require(...).x" call with the corresponding id in it.
 */
const requireNamedTemplate = template.statement(`
  var LOCAL = require(FILE).REMOTE;
`);

/**
 * Produces a Babel template that transforms an "import ..." into
 * "require(...)", which is considered a side-effect call.
 */
const requireSideEffectTemplate = template.statement(`
  require(FILE);
`);

// NOTE(@krystofwoldrich): Export all template doesn't have to check for export existence
// because it always runs before default and named exports which overwrite the exports object.
// NOTE(@krystofwoldrich): This also re-exports `default` and `__esModule` properties
// we might want to remove that in the future to align with the spec.
/**
 * Produces an "export all" template that traverses all exported symbols and
 * re-exposes them.
 */
const exportAllTemplate = template.statements(`
  var REQUIRED = require(FILE);

  for (var KEY in REQUIRED) {
    exports[KEY] = REQUIRED[KEY];
  }
`);

/**
 * Produces a "named export" or "default export" template to export a single
 * symbol.
 */
const exportTemplate = template.statement(`
  exports.REMOTE = LOCAL;
`);

// NOTE(krystofwoldrich): for (var KEY in REQUIRED) { doesn't work here
/**
 * Produces an "export all" template that traverses all exported symbols and
 * re-exposes them.
 */
const liveBindExportAllTemplate = template.statements(`
  var REQUIRED = require(FILE);

  Object.keys(REQUIRED).forEach(function (KEY) {
    if (KEY === "default" || KEY === "__esModule") return;
    if (Object.prototype.hasOwnProperty.call(EXPORTED_NAMES, KEY)) return;
    if (KEY in exports && exports[KEY] === REQUIRED[KEY]) return;
    Object.defineProperty(exports, KEY, {
      enumerable: true,
      get: function () {
        return REQUIRED[KEY];
      }
    });
  });
`);

/**
 * Produces a live binding export template that creates a getter.
 */
const liveBindExportTemplate = template.statement(`
  Object.defineProperty(exports, "REMOTE", {
    enumerable: true,
    get: function () {
      return REQUIRED.LOCAL;
    }
  });
`);

/**
 * Produces a live binding export default template that creates a getter.
 */
const liveBindExportDefaultTemplate = template.statement(`
  Object.defineProperty(exports, "REMOTE", {
    enumerable: true,
    get: function () {
      return (function (m) {
        return m && m.__esModule ? m.default : m
      })(REQUIRED);
    }
  });
`);

/**
 * Flags the exported module as a transpiled ES module. Needs to be kept in 1:1
 * compatibility with Babel.
 */
const esModuleExportTemplate = template.statement(`
  Object.defineProperty(exports, '__esModule', {value: true});
`);

/**
 * Resolution template in case it is requested.
 */
const resolveTemplate = template.expression(`
  require.resolve(NODE)
`);

/**
 * Creates static exported names array for the module.
 *
 * @example var _exportedNames = ['name1', 'name2', ...];
 */
const exportedNamesTemplate = ({
  t: b,
  NAMES,
  IDENTIFIER,
}: {
  t: typeof t;
  NAMES: readonly string[];
  IDENTIFIER: string;
}) => {
  return b.variableDeclaration('var', [
    b.variableDeclarator(
      b.identifier(IDENTIFIER),
      b.objectExpression(
        NAMES.map((v) => b.objectProperty(b.stringLiteral(v), b.booleanLiteral(true)))
      )
    ),
  ]);
};

/**
 * Enforces the resolution of a path to a fully-qualified one, if set.
 */
function resolvePath<TNode extends t.Node>(node: TNode, resolve: boolean): t.Expression | TNode {
  if (!resolve) {
    return node;
  }

  return resolveTemplate({
    NODE: node,
  });
}

function withLocation<TNode extends t.Node>(
  node: TNode,
  loc: t.SourceLocation | null | undefined
): TNode;

function withLocation<TNode extends t.Node>(
  nodeArray: readonly TNode[],
  loc: t.SourceLocation | null | undefined
): TNode[];

function withLocation<TNode extends t.Node>(
  nodeOrArray: TNode | readonly TNode[],
  loc: t.SourceLocation | null | undefined
): TNode | TNode[] {
  if (Array.isArray(nodeOrArray)) {
    return nodeOrArray.map((n) => withLocation(n, loc));
  }

  const node = nodeOrArray as TNode;
  if (!node.loc) {
    return { ...node, loc };
  }
  return node;
}

export function importExportPlugin({
  types: t,
}: ConfigAPI & typeof import('@babel/core')): PluginObj<State> {
  const { isDeclaration, isVariableDeclaration } = t;

  return {
    visitor: {
      ExportAllDeclaration(path: NodePath<t.ExportAllDeclaration>, state: State): void {
        state.originalImportOrder.add(path.node.source.value);
        state.exportAllFrom.set(path.node.source.value, {
          loc: path.node.loc,
        });
        path.remove();
      },

      ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>, state: State): void {
        const declaration = path.node.declaration;
        const id =
          ('id' in declaration && declaration.id) || path.scope.generateUidIdentifier('default');
        (declaration as { id: t.Identifier }).id = id;

        const loc = path.node.loc;

        if (isDeclaration(declaration)) {
          path.insertBefore(withLocation(declaration, loc));
        } else {
          path.insertBefore(
            withLocation(t.variableDeclaration('var', [t.variableDeclarator(id, declaration)]), loc)
          );
        }

        state.exportDefault.push({
          name: id.name,
          loc,
        });
        path.remove();
      },

      ExportNamedDeclaration(path: NodePath<t.ExportNamedDeclaration>, state: State): void {
        if (path.node.exportKind && path.node.exportKind !== 'value') {
          return;
        }

        const loc = path.node.loc;

        const declaration = path.node.declaration;
        if (declaration) {
          if (isVariableDeclaration(declaration)) {
            declaration.declarations.forEach((d) => {
              switch (d.id.type) {
                case 'ObjectPattern':
                  {
                    const properties = d.id.properties;
                    properties.forEach((p) => {
                      const nameCandidate = p.type === 'ObjectProperty' ? p.value : p.argument;
                      const name = 'name' in nameCandidate ? nameCandidate.name : undefined;
                      if (name) {
                        state.exportNamed.push({
                          name,
                          as: name,
                          loc,
                        });
                      } else {
                        debug(
                          'Unexpected export named declaration with object pattern without name.',
                          p.toString()
                        );
                      }
                    });
                  }
                  break;
                case 'ArrayPattern':
                  {
                    const elements = d.id.elements;
                    elements.forEach((e) => {
                      if (!e) {
                        return;
                      }

                      const nameCandidate = 'argument' in e ? e.argument : e;
                      const name = 'name' in nameCandidate ? nameCandidate.name : undefined;
                      if (name) {
                        state.exportNamed.push({
                          name,
                          as: name,
                          loc,
                        });
                      } else {
                        debug(
                          'Unexpected export named declaration with array pattern without name.',
                          e?.toString()
                        );
                      }
                    });
                  }
                  break;
                default:
                  {
                    const id = d.id;
                    const name = 'name' in id ? id.name : undefined;
                    if (name) {
                      state.exportNamed.push({
                        name,
                        as: name,
                        loc,
                      });
                    } else {
                      debug(
                        'Unexpected export named declaration with identifier without name.',
                        id.toString()
                      );
                    }
                  }
                  break;
              }
            });
          } else {
            if ('id' in declaration) {
              const id = declaration.id || path.scope.generateUidIdentifier();
              const name = id.type === 'StringLiteral' ? id.value : id.name;

              declaration.id = id;
              state.exportNamed.push({
                name,
                as: name,
                loc,
              });
            } else {
              debug('Unexpected export named declaration without id.', declaration.toString());
            }
          }

          path.insertBefore(declaration);
        }

        const specifiers = path.node.specifiers;
        if (specifiers && specifiers.length) {
          const source = path.node.source?.value;
          if (source) state.originalImportOrder.add(source);
          specifiers.forEach((s) => {
            // TODO: check if still needed
            // if (s.exported.type === 'StringLiteral') {
            //   // https://babeljs.io/docs/en/babel-plugin-syntax-module-string-names
            //   throw path.buildCodeFrameError('Module string names are not supported');
            // }
            switch (s.type) {
              case 'ExportSpecifier':
                (source ? state.exportNamedFrom.getOrDefault(source) : state.exportNamed).push({
                  name: s.local.name,
                  as: s.exported.type === 'Identifier' ? s.exported.name : s.exported.value,
                  loc: path.node.loc,
                });
                break;
              case 'ExportDefaultSpecifier':
                state.exportNamedFrom.getOrDefault(nullthrows(source)).push({
                  name: 'default',
                  as: s.exported.name,
                  loc: path.node.loc,
                });
                break;
              case 'ExportNamespaceSpecifier':
                // export * as b from 'a'
                state.exportAllFromAs.getOrDefault(nullthrows(source)).push({
                  as: s.exported.name,
                  loc: path.node.loc,
                });
                break;
              default:
                debug(
                  'Unexpected export named declaration specifier type.',
                  (s as object).toString()
                );
                break;
            }
          });
        }
        path.remove();
      },

      ImportDeclaration(path: NodePath<t.ImportDeclaration>, state: State): void {
        if (path.node.importKind && path.node.importKind !== 'value') {
          return;
        }

        const file = path.node.source;
        const specifiers = path.node.specifiers;
        const loc = path.node.loc;

        state.originalImportOrder.add(file.value);
        if (!specifiers.length) {
          state.importSideEffect.set(file.value, { loc });
        } else {
          specifiers.forEach((s) => {
            switch (s.type) {
              case 'ImportNamespaceSpecifier':
                state.importAllFromAs.getOrDefault(file.value).push({
                  as: s.local.name,
                  loc: path.node.loc,
                });
                break;

              case 'ImportDefaultSpecifier':
                state.importDefaultFromAs.getOrDefault(file.value).push({
                  as: s.local.name,
                  loc: path.node.loc,
                });
                break;

              case 'ImportSpecifier': {
                const importedName =
                  s.imported.type === 'StringLiteral' ? s.imported.value : s.imported.name;
                state.importNamedFrom.getOrDefault(file.value).push({
                  name: importedName,
                  as: s.local.name,
                  loc: path.node.loc,
                });

                if (importedName !== 'default') {
                  state.importedIdentifiers.getOrDefault(s.local.name).push({
                    module: file.value,
                    name: importedName,
                  });
                }
                break;
              }
              default:
                throw new TypeError('Unknown import type: ' + (s as { type: string }).type);
            }
          });
        }

        path.remove();
      },

      Program: {
        enter(path: NodePath<t.Program>, state: State): void {
          state.exportAll = [];
          state.exportDefault = [];
          state.exportNamed = [];

          state.imports = [];
          state.importAll = t.identifier(state.opts.importAll);
          state.importDefault = t.identifier(state.opts.importDefault);
          state.namespaceForLocal = new Map();

          state.originalImportOrder = new Set();
          state.exportAllFrom = new Map();
          state.importAllFromAs = new MapToArray();
          state.exportAllFromAs = new MapToArray();
          state.importDefaultFromAs = new MapToArray();
          state.exportDefault = [];
          state.exportNamedFrom = new MapToArray();
          state.importNamedFrom = new MapToArray();
          state.exportNamed = [];
          state.importedIdentifiers = new MapToArray();
          state.importSideEffect = new Map();

          // Rename declarations at module scope that might otherwise conflict
          // with arguments we inject into the module factory.
          // Note that it isn't necessary to rename importAll/importDefault
          // because Metro already uses generateUid to generate unused names.
          ['module', 'global', 'exports', 'require'].forEach((name) => path.scope.rename(name));
        },

        exit(path: NodePath<t.Program>, state: State): void {
          const hasEsmExport =
            state.exportDefault.length ||
            state.exportAllFrom.size ||
            state.exportNamed.length ||
            state.exportAllFromAs.size ||
            state.exportNamedFrom.size;
          if (state.opts.liveBindings) {
            const _namespaceForLocal = new Map<string, { namespace: string; remote: string }>();
            const liveExports: t.Statement[] = [];
            const exportAll: t.Statement[] = [];
            const imports: t.Statement[] = [];
            const staticExports: t.Statement[] = [];
            const defaultStaticExports: t.Statement[] = [];

            const exportedNames: string[] = [];
            for (const e of state.exportAllFromAs.values()) {
              for (const { as } of e) {
                exportedNames.push(as);
              }
            }
            for (const e of state.exportNamedFrom.values()) {
              for (const { as } of e) {
                exportedNames.push(as);
              }
            }
            const exportedNamesIdentifier = path.scope.generateUidIdentifier('_exportedNames');
            if (state.exportAllFrom.size) {
              // Generate a static list of exported names to runtime overwrites;
              liveExports.push(
                exportedNamesTemplate({
                  t,
                  IDENTIFIER: exportedNamesIdentifier.name,
                  NAMES: exportedNames,
                })
              );
            }

            for (const module of state.originalImportOrder) {
              const exportAllFrom = state.exportAllFrom.get(module);
              const importAllAsFrom = state.importAllFromAs.getOrDefault(module);
              const exportAllAsFrom = state.exportAllFromAs.getOrDefault(module);
              const importDefaultAsFrom = state.importDefaultFromAs.getOrDefault(module);
              const exportNamedFrom = state.exportNamedFrom.getOrDefault(module);
              const importNamedFrom = state.importNamedFrom.getOrDefault(module);

              let namespace: t.Identifier | null = null;

              if (exportAllFrom) {
                namespace = path.scope.generateUidIdentifier(module);
                exportAll.push(
                  ...withLocation(
                    liveBindExportAllTemplate({
                      FILE: resolvePath(t.stringLiteral(module), state.opts.resolve),
                      REQUIRED: t.cloneNode(namespace),
                      KEY: path.scope.generateUidIdentifier('key'),
                      EXPORTED_NAMES: t.cloneNode(exportedNamesIdentifier),
                    }),
                    exportAllFrom.loc
                  )
                );
              }

              for (const { as, loc } of exportAllAsFrom) {
                const importAllNamespace = path.scope.generateUidIdentifier(module);
                imports.push(
                  withLocation(
                    importTemplate({
                      IMPORT: t.cloneNode(state.importAll),
                      FILE: resolvePath(t.stringLiteral(module), state.opts.resolve),
                      LOCAL: t.cloneNode(importAllNamespace),
                    }),
                    loc
                  )
                );
                staticExports.push(
                  withLocation(
                    exportTemplate({
                      LOCAL: t.cloneNode(importAllNamespace),
                      REMOTE: t.identifier(as),
                    }),
                    loc
                  )
                );
              }

              for (const { name, as, loc } of exportNamedFrom) {
                if (!namespace) {
                  namespace = path.scope.generateUidIdentifier(module);
                  imports.push(
                    withLocation(
                      requireTemplate({
                        FILE: resolvePath(t.stringLiteral(module), state.opts.resolve),
                        LOCAL: t.cloneNode(namespace),
                      }),
                      loc
                    )
                  );
                }

                if (name === 'default') {
                  liveExports.push(
                    withLocation(
                      liveBindExportDefaultTemplate({
                        REQUIRED: t.cloneNode(namespace),
                        REMOTE: as,
                      }),
                      loc
                    )
                  );
                } else {
                  liveExports.push(
                    withLocation(
                      liveBindExportTemplate({
                        REQUIRED: t.cloneNode(namespace),
                        LOCAL: t.identifier(name),
                        REMOTE: as,
                      }),
                      loc
                    )
                  );
                }
              }

              for (const { name, as, loc } of importNamedFrom) {
                if (name === 'default') {
                  imports.push(
                    withLocation(
                      importTemplate({
                        IMPORT: t.cloneNode(state.importDefault),
                        FILE: resolvePath(t.stringLiteral(module), state.opts.resolve),
                        LOCAL: t.identifier(as),
                      }),
                      loc
                    )
                  );
                  // For default imports we don't want to create a namespace
                  continue;
                }

                if (!namespace) {
                  namespace = path.scope.generateUidIdentifier(module);
                  imports.push(
                    withLocation(
                      requireTemplate({
                        FILE: resolvePath(t.stringLiteral(module), state.opts.resolve),
                        LOCAL: t.cloneNode(namespace),
                      }),
                      loc
                    )
                  );
                }

                _namespaceForLocal.set(as, {
                  namespace: namespace.name,
                  remote: name,
                });
              }

              if (!namespace && state.importSideEffect.has(module)) {
                imports.push(
                  withLocation(
                    requireSideEffectTemplate({
                      FILE: resolvePath(t.stringLiteral(module), state.opts.resolve),
                    }),
                    state.importSideEffect.get(module)?.loc
                  )
                );
              }

              for (const { as, loc } of importAllAsFrom) {
                imports.push(
                  withLocation(
                    importTemplate({
                      IMPORT: t.cloneNode(state.importAll),
                      FILE: resolvePath(t.stringLiteral(module), state.opts.resolve),
                      LOCAL: t.identifier(as),
                    }),
                    loc
                  )
                );
              }

              for (const { as, loc } of importDefaultAsFrom) {
                imports.push(
                  withLocation(
                    importTemplate({
                      IMPORT: t.cloneNode(state.importDefault),
                      FILE: resolvePath(t.stringLiteral(module), state.opts.resolve),
                      LOCAL: t.identifier(as),
                    }),
                    loc
                  )
                );
              }
            }

            for (const { name, as, loc } of state.exportNamed) {
              if (state.importedIdentifiers.has(name)) {
                liveExports.push(
                  withLocation(
                    template.statement(`
                      Object.defineProperty(exports, "REMOTE", {
                        enumerable: true,
                        get: function () {
                          return LOCAL;
                        }
                      });
                    `)({
                      REMOTE: name,
                      LOCAL: t.identifier(as),
                    }),
                    loc
                  )
                );
              } else {
                staticExports.push(
                  withLocation(
                    exportTemplate({
                      LOCAL: t.identifier(as),
                      REMOTE: t.identifier(name),
                    }),
                    loc
                  )
                );
              }
            }

            for (const { name, loc } of state.exportDefault) {
              defaultStaticExports.push(
                withLocation(
                  exportTemplate({
                    LOCAL: t.identifier(name),
                    REMOTE: t.identifier('default'),
                  }),
                  loc
                )
              );
            }

            const body = path.node.body;

            body.unshift(...imports);
            body.unshift(...exportAll);
            body.unshift(...liveExports);
            // program body
            body.push(...staticExports);
            body.push(...defaultStaticExports);
            // 1. live binded exports
            // 2. live binded export all
            // 3. imports
            // 4. program
            // 5. static exports

            // Inspired by https://github.com/babel/babel/blob/e5c8dc7330cb2f66c37637677609df90b31ff0de/packages/babel-helper-module-transforms/src/rewrite-live-references.ts#L99
            // Live bindings implementation:
            // 1. Instead of creating direct variable assignments like `var local = require(file).remote`,
            //    we create namespace variables: `var namespace = require(file)` and keep track of them in
            //    `state.namespaceForLocal` which maps local names to their namespace and remote names.
            // 2. When we encounter a reference to an imported name (exists in the namespaceForLocal map),
            //    we replace it with a dynamic property access: `namespace.remote`
            //
            //    We traverse the ReferencedIdentifier on the Program exit to ensure all imported names
            //    were collected before replacing them with the namespace property access.
            type ReferencedIdentifierTravelerState = {
              namespaceForLocal: Map<string, { namespace: string; remote: string }>;
              programScope: typeof path.scope;
            };
            path.traverse<ReferencedIdentifierTravelerState>(
              {
                ReferencedIdentifier(
                  path: NodePath<t.Identifier | t.JSXIdentifier>,
                  state: ReferencedIdentifierTravelerState
                ) {
                  const localName = path.node.name;
                  const { namespace, remote } = state.namespaceForLocal.get(localName) ?? {};
                  // not from a namespace
                  if (!namespace || !remote) return;

                  const localBinding = path.scope.getBinding(localName);
                  const rootBinding = state.programScope.getBinding(localName);
                  // redeclared in this scope
                  if (rootBinding !== localBinding) return;

                  if (path.type === 'JSXIdentifier') {
                    path.replaceWith(
                      t.jsxMemberExpression(t.jsxIdentifier(namespace), t.jsxIdentifier(remote))
                    );
                  } else {
                    // Identifier
                    path.replaceWith(
                      t.memberExpression(t.identifier(namespace), t.identifier(remote))
                    );
                  }
                },
              },
              {
                namespaceForLocal: _namespaceForLocal,
                programScope: path.scope,
              }
            );

            if (hasEsmExport) {
              body.unshift(esModuleExportTemplate());
              if (state.opts.out) {
                state.opts.out.isESModule = true;
              }
            } else if (state.opts.out) {
              state.opts.out.isESModule = false;
            }
            // Exit after new live binding version was processed.
            return;
          }

          // TODO: Return loose impl
          console.log('Not implemented.');
        },
      },
    },
  };
}
