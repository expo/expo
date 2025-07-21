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

import type { PluginObj } from '@babel/core';
import template from '@babel/template';
import type { NodePath } from '@babel/traverse';
import type {
  ExportNamedDeclaration,
  ImportDeclaration,
  Program,
  Statement,
  SourceLocation as BabelSourceLocation,
  Node as BabelNode,
  Expression as BabelNodeExpression,
  ExportAllDeclaration as BabelNodeExportAllDeclaration,
  ExportDefaultDeclaration as BabelNodeExportDefaultDeclaration,
  Identifier as BabelNodeIdentifier,
  // eslint-disable-next-line import/no-duplicates
} from '@babel/types';
// eslint-disable-next-line import/no-duplicates
import type * as BabelTypes from '@babel/types';
import assert from 'node:assert';

type Types = typeof BabelTypes;

function nullthrows<T extends object>(x: T | null, message?: string): NonNullable<T> {
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

type State = {
  exportAll: { file: string; loc?: BabelSourceLocation | null; [key: string]: unknown }[];
  exportDefault: {
    local: string;
    loc?: BabelSourceLocation | null;
    namespace?: string;
    [key: string]: unknown;
  }[];
  exportNamed: {
    local: string;
    remote: string;
    loc?: BabelSourceLocation | null;
    namespace?: string;
    [key: string]: unknown;
  }[];
  imports: { node: Statement }[];
  importDefault: BabelNode;
  importAll: BabelNode;
  opts: Options;
  importedIdentifiers: Map<string, { source: string; imported: string }>;
  namespaceForLocal: Map<string, { namespace: string; remote: string }>;
  [key: string]: unknown;
};

/**
 * Produces a Babel template that transforms an "import { x } from a" into
 * "var _a = require(a)" call which needs to be followed by
 * update of the "x" references to "_a.x".
 */
const importTemplate = template.statement(`
  var LOCAL = require(FILE);
`);

/**
 * Produces a Babel template that transforms an "import * as x from ..." or an
 * "import x from ..." call into a "const x = importAll(...)" call with the
 * corresponding id in it.
 */
const importAllTemplate = template.statement(`
  var LOCAL = IMPORT(FILE);
`);

/**
 * Produces a Babel template that transforms an "import {x as y} from ..." into
 * "const y = require(...).x" call with the corresponding id in it.
 */
const importNamedTemplate = template.statement(`
  var LOCAL = require(FILE).REMOTE;
`);

/**
 * Produces a Babel template that transforms an "import ..." into
 * "require(...)", which is considered a side-effect call.
 */
const importSideEffectTemplate = template.statement(`
  require(FILE);
`);

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
 * Enforces the resolution of a path to a fully-qualified one, if set.
 */
function resolvePath<TNode extends BabelNode>(
  node: TNode,
  resolve: boolean
): BabelNodeExpression | TNode {
  if (!resolve) {
    return node;
  }

  return resolveTemplate({
    NODE: node,
  });
}

function withLocation<TNode extends BabelNode>(
  node: TNode,
  loc: BabelSourceLocation | null | undefined
): TNode;

// eslint-disable-next-line no-redeclare
function withLocation<TNode extends BabelNode>(
  node: readonly TNode[],
  loc: BabelSourceLocation | null | undefined
): TNode[];

function withLocation<TNode extends BabelNode>(
  node: TNode | readonly TNode[],
  loc: BabelSourceLocation | null | undefined
): TNode | TNode[] {
  if (Array.isArray(node)) {
    return node.map((n) => withLocation(n, loc));
  }

  // TODO: improve types

  if (!(node as TNode).loc) {
    return { ...node, loc } as TNode;
  }

  return node as TNode;
}

export function importExportPlugin({ types: t }: { types: Types }): PluginObj<State> {
  const { isDeclaration, isVariableDeclaration } = t;

  return {
    visitor: {
      ExportAllDeclaration(path: NodePath<BabelNodeExportAllDeclaration>, state: State): void {
        state.exportAll.push({
          file: path.node.source.value,
          loc: path.node.loc,
        });

        path.remove();
      },

      ExportDefaultDeclaration(
        path: NodePath<BabelNodeExportDefaultDeclaration>,
        state: State
      ): void {
        const declaration = path.node.declaration;
        const id =
          // @ts-expect-error Property 'id' does not exist on type 'ArrayExpression'
          declaration.id ||
          //
          path.scope.generateUidIdentifier('default');

        // @ts-expect-error Property 'id' does not exist on type 'ArrayExpression'
        declaration.id = id;

        const loc = path.node.loc;

        state.exportDefault.push({
          local: id.name,
          loc,
        });

        if (isDeclaration(declaration)) {
          path.insertBefore(withLocation(declaration, loc));
        } else {
          path.insertBefore(
            withLocation(t.variableDeclaration('var', [t.variableDeclarator(id, declaration)]), loc)
          );
        }

        path.remove();
      },

      ExportNamedDeclaration(path: NodePath<ExportNamedDeclaration>, state: State): void {
        if (path.node.exportKind && path.node.exportKind !== 'value') {
          return;
        }

        const declaration = path.node.declaration;
        const loc = path.node.loc;

        if (declaration) {
          if (isVariableDeclaration(declaration)) {
            declaration.declarations.forEach((d) => {
              switch (d.id.type) {
                case 'ObjectPattern':
                  {
                    const properties = d.id.properties;
                    properties.forEach((p) => {
                      // @ts-expect-error Property 'name' does not exist on type 'ArrayExpression'.
                      const name = 'value' in p ? p.value.name : p.argument.name;
                      state.exportNamed.push({ local: name, remote: name, loc });
                    });
                  }
                  break;
                case 'ArrayPattern':
                  {
                    const elements = d.id.elements;
                    elements.forEach((e) => {
                      // @ts-expect-error Property 'name' does not exist on type 'ArrayExpression'.
                      const name = 'argument' in e ? e.argument.name : e.name;
                      state.exportNamed.push({ local: name, remote: name, loc });
                    });
                  }
                  break;
                default:
                  {
                    // @ts-expect-error Property 'name' does not exist on type 'AssignmentPattern'
                    const name = d.id.name;
                    state.exportNamed.push({ local: name, remote: name, loc });
                  }
                  break;
              }
            });
          } else {
            const id =
              // @ts-expect-error Property 'id' does not exist on type 'DeclareExportAllDeclaration'
              declaration.id ||
              //
              path.scope.generateUidIdentifier();
            const name = id.name;

            // @ts-expect-error Property 'id' does not exist on type 'ExportAllDeclaration'.
            declaration.id = id;
            state.exportNamed.push({ local: name, remote: name, loc });
          }

          path.insertBefore(declaration);
        }

        const specifiers = path.node.specifiers;
        if (specifiers) {
          specifiers.forEach((s) => {
            // @ts-expect-error Property 'local' does not exist on type 'ExportDefaultSpecifier'
            let local = s.local;
            const remote = s.exported;

            // export * as b from 'a'
            if (!local && s.type === 'ExportNamespaceSpecifier') {
              local = s.exported;
            }

            if (remote.type === 'StringLiteral') {
              // https://babeljs.io/docs/en/babel-plugin-syntax-module-string-names
              throw path.buildCodeFrameError('Module string names are not supported');
            }

            if (path.node.source) {
              const temp = state.opts.liveBindings
                ? // For live bindings, we need to create a require statement for the module namespace
                  path.scope.generateUidIdentifier(
                    nullthrows(path.node.source).value.replace(/[^a-zA-Z0-9]/g, '_')
                  )
                : path.scope.generateUidIdentifier(local.name);

              if (local.name === 'default') {
                path.insertBefore(
                  withLocation(
                    importAllTemplate({
                      IMPORT: t.cloneNode(state.importDefault),
                      FILE: resolvePath(
                        t.cloneNode(nullthrows(path.node.source)),
                        state.opts.resolve
                      ),
                      LOCAL: temp,
                    }),
                    loc
                  )
                );

                state.exportNamed.push({
                  local: temp.name,
                  remote: remote.name,
                  loc,
                });
              } else if (remote.name === 'default') {
                if (state.opts.liveBindings) {
                  path.insertBefore(
                    withLocation(
                      importTemplate({
                        FILE: resolvePath(
                          t.cloneNode(nullthrows(path.node.source)),
                          state.opts.resolve
                        ),
                        LOCAL: temp,
                      }),
                      loc
                    )
                  );
                  state.exportDefault.push({
                    namespace: temp.name,
                    local: local.name,
                    loc,
                  });
                } else {
                  path.insertBefore(
                    withLocation(
                      importNamedTemplate({
                        FILE: resolvePath(
                          t.cloneNode(nullthrows(path.node.source)),
                          state.opts.resolve
                        ),
                        LOCAL: temp,
                        REMOTE: local,
                      }),
                      loc
                    )
                  );
                  state.exportDefault.push({ local: temp.name, loc });
                }
              } else if (s.type === 'ExportNamespaceSpecifier') {
                path.insertBefore(
                  withLocation(
                    importAllTemplate({
                      IMPORT: t.cloneNode(state.importAll),
                      FILE: resolvePath(
                        t.cloneNode(nullthrows(path.node.source)),
                        state.opts.resolve
                      ),
                      LOCAL: temp,
                    }),
                    loc
                  )
                );
                state.exportNamed.push({
                  local: temp.name,
                  remote: remote.name,
                  loc,
                });
              } else {
                if (state.opts.liveBindings) {
                  path.insertBefore(
                    withLocation(
                      importTemplate({
                        FILE: resolvePath(
                          t.cloneNode(nullthrows(path.node.source)),
                          state.opts.resolve
                        ),
                        LOCAL: temp,
                      }),
                      loc
                    )
                  );
                  state.exportNamed.push({
                    local: local.name,
                    remote: remote.name,
                    loc,
                    namespace: temp.name,
                  });
                } else {
                  path.insertBefore(
                    withLocation(
                      importNamedTemplate({
                        FILE: resolvePath(
                          t.cloneNode(nullthrows(path.node.source)),
                          state.opts.resolve
                        ),
                        LOCAL: temp,
                        REMOTE: local,
                      }),
                      loc
                    )
                  );
                  state.exportNamed.push({
                    local: temp.name,
                    remote: remote.name,
                    loc,
                  });
                }
              }
            } else {
              // Check if this identifier was imported and use live bindings if so
              const importInfo = state.importedIdentifiers.get(local.name);
              if (importInfo && state.opts.liveBindings) {
                if (remote.name === 'default') {
                  state.exportDefault.push({
                    local: importInfo.imported,
                    loc,
                    namespace: importInfo.source,
                  });
                } else {
                  state.exportNamed.push({
                    local: importInfo.imported,
                    remote: remote.name,
                    loc,
                    namespace: importInfo.source,
                  });
                }
              } else {
                if (remote.name === 'default') {
                  state.exportDefault.push({ local: local.name, loc });
                } else {
                  state.exportNamed.push({
                    local: local.name,
                    remote: remote.name,
                    loc,
                  });
                }
              }
            }
          });
        }

        path.remove();
      },

      ImportDeclaration(path: NodePath<ImportDeclaration>, state: State): void {
        if (path.node.importKind && path.node.importKind !== 'value') {
          return;
        }

        const file = path.node.source;
        const specifiers = path.node.specifiers;
        const loc = path.node.loc;

        if (!specifiers.length) {
          state.imports.push({
            node: withLocation(
              importSideEffectTemplate({
                FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
              }),
              loc
            ),
          });
        } else {
          let sharedModuleImport: BabelNodeIdentifier;
          let sharedModuleVariableDeclaration = null;
          if (
            specifiers.filter(
              (s) =>
                s.type === 'ImportSpecifier' &&
                (s.imported.type === 'StringLiteral' || s.imported.name !== 'default')
            ).length > 1
          ) {
            sharedModuleImport = path.scope.generateUidIdentifierBasedOnNode(file);
            sharedModuleVariableDeclaration = withLocation(
              t.variableDeclaration('var', [
                t.variableDeclarator(
                  t.cloneNode(sharedModuleImport),
                  t.callExpression(t.identifier('require'), [
                    resolvePath(t.cloneNode(file), state.opts.resolve),
                  ])
                ),
              ]),
              loc
            );
            state.imports.push({
              node: sharedModuleVariableDeclaration,
            });
          }

          specifiers.forEach((s) => {
            // @ts-expect-error Property 'imported' does not exist on type 'ImportDefaultSpecifier'
            const imported = s.imported;
            const local = s.local;
            const getLocalModule = () =>
              path.scope.generateUidIdentifier(file.value.replace(/[^a-zA-Z0-9]/g, '_'));

            switch (s.type) {
              case 'ImportNamespaceSpecifier':
                state.imports.push({
                  node: withLocation(
                    importAllTemplate({
                      IMPORT: t.cloneNode(state.importAll),
                      FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                      LOCAL: t.cloneNode(local),
                    }),
                    loc
                  ),
                });
                break;

              case 'ImportDefaultSpecifier':
                state.imports.push({
                  node: withLocation(
                    importAllTemplate({
                      IMPORT: t.cloneNode(state.importDefault),
                      FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                      LOCAL: t.cloneNode(local),
                    }),
                    loc
                  ),
                });
                break;

              case 'ImportSpecifier':
                // eslint-disable-next-line no-case-declarations
                const localModule = getLocalModule();
                state.importedIdentifiers.set(local.name, {
                  source: localModule.name,
                  imported: imported.name,
                });
                if (imported.name === 'default') {
                  state.imports.push({
                    node: withLocation(
                      importAllTemplate({
                        IMPORT: t.cloneNode(state.importDefault),
                        FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                        LOCAL: t.cloneNode(local),
                      }),
                      loc
                    ),
                  });
                } else if (sharedModuleVariableDeclaration != null) {
                  sharedModuleVariableDeclaration.declarations.push(
                    withLocation(
                      t.variableDeclarator(
                        t.cloneNode(local),
                        t.memberExpression(t.cloneNode(sharedModuleImport), t.cloneNode(imported))
                      ),
                      loc
                    )
                  );
                } else {
                  if (state.opts.liveBindings) {
                    state.imports.push({
                      node: withLocation(
                        importTemplate({
                          FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                          LOCAL: t.cloneNode(localModule),
                        }),
                        loc
                      ),
                    });
                    state.namespaceForLocal.set(local.name, {
                      namespace: localModule.name,
                      // local: local.name,
                      remote: imported.name,
                    });
                  } else {
                    state.imports.push({
                      node: withLocation(
                        importNamedTemplate({
                          FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                          LOCAL: t.cloneNode(local),
                          REMOTE: t.cloneNode(imported),
                        }),
                        loc
                      ),
                    });
                  }
                }
                break;

              default:
                // TODO: improve types
                throw new TypeError('Unknown import type: ' + (s as { type: string }).type);
            }
          });
        }

        path.remove();
      },

      Program: {
        enter(path: NodePath<Program>, state: State): void {
          state.exportAll = [];
          state.exportDefault = [];
          state.exportNamed = [];

          state.imports = [];
          state.importAll = t.identifier(state.opts.importAll);
          state.importDefault = t.identifier(state.opts.importDefault);
          state.importedIdentifiers = new Map();
          state.namespaceForLocal = new Map();

          // Rename declarations at module scope that might otherwise conflict
          // with arguments we inject into the module factory.
          // Note that it isn't necessary to rename importAll/importDefault
          // because Metro already uses generateUid to generate unused names.
          ['module', 'global', 'exports', 'require'].forEach((name) => path.scope.rename(name));
        },

        exit(path: NodePath<Program>, state: State): void {
          const body = path.node.body;

          // state.imports = [node1, node2, node3, ...nodeN]
          state.imports.reverse().forEach((e: { node: Statement }) => {
            // import nodes are added to the top of the program body
            body.unshift(e.node);
          });

          state.exportDefault.forEach((e) => {
            if (e.namespace) {
              body.push(
                withLocation(
                  liveBindExportTemplate({
                    REQUIRED: t.identifier(e.namespace),
                    LOCAL: t.identifier(e.local),
                    REMOTE: 'default',
                  }),
                  e.loc
                )
              );
            } else {
              body.push(
                withLocation(
                  exportTemplate({
                    LOCAL: t.identifier(e.local),
                    REMOTE: t.identifier('default'),
                  }),
                  e.loc
                )
              );
            }
          });

          state.exportAll.forEach((e) => {
            const template = state.opts.liveBindings
              ? liveBindExportAllTemplate
              : exportAllTemplate;
            body.push(
              ...withLocation(
                template({
                  FILE: resolvePath(t.stringLiteral(e.file), state.opts.resolve),
                  REQUIRED: path.scope.generateUidIdentifier(e.file),
                  KEY: path.scope.generateUidIdentifier('key'),
                }),
                e.loc
              )
            );
          });

          state.exportNamed.forEach((e) => {
            if (e.namespace) {
              body.push(
                withLocation(
                  liveBindExportTemplate({
                    REQUIRED: t.identifier(e.namespace),
                    LOCAL: t.identifier(e.local),
                    REMOTE: e.remote,
                  }),
                  e.loc
                )
              );
            } else {
              body.push(
                withLocation(
                  exportTemplate({
                    LOCAL: t.identifier(e.local),
                    REMOTE: t.identifier(e.remote),
                  }),
                  e.loc
                )
              );
            }
          });

          // inspired by https://github.com/babel/babel/blob/e5c8dc7330cb2f66c37637677609df90b31ff0de/packages/babel-helper-module-transforms/src/rewrite-live-references.ts#L99
          path.traverse(
            {
              // @ts-expect-error ReferencedIdentifier is not in the types
              ReferencedIdentifier: (path, state) => {
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
              namespaceForLocal: state.namespaceForLocal,
              programScope: path.scope,
            }
          );

          if (state.exportDefault.length || state.exportAll.length || state.exportNamed.length) {
            body.unshift(esModuleExportTemplate());
            if (state.opts.out) {
              state.opts.out.isESModule = true;
            }
          } else if (state.opts.out) {
            state.opts.out.isESModule = false;
          }
        },
      },
    },
  };
}
