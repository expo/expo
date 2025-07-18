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
import type { NodePath, PluginObj, types as t } from '@babel/core';
import assert from 'node:assert';

type Types = typeof import('@babel/core').types;

function nullthrows<T extends object>(x: T | null, message?: string): NonNullable<T> {
  assert(x != null, message);
  return x;
}

export type Options = Readonly<{
  importDefault: string;
  importAll: string;
  resolve: boolean;
  out?: {
    isESModule: boolean;
    [key: string]: unknown;
  };
}>;

type State = {
  exportAll: { file: string; loc?: t.SourceLocation | null; [key: string]: unknown }[];
  exportDefault: { local: string; loc?: t.SourceLocation | null; [key: string]: unknown }[];
  exportNamed: {
    local: string;
    remote: string;
    loc?: t.SourceLocation | null;
    [key: string]: unknown;
  }[];
  imports: { node: t.Statement }[];
  importDefault: t.Node;
  importAll: t.Node;
  opts: Options;
  [key: string]: unknown;
};

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
function resolvePath<TNode extends t.Node>(
  node: TNode,
  resolve: boolean
): t.Expression | TNode {
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

// eslint-disable-next-line no-redeclare
function withLocation<TNode extends t.Node>(
  node: readonly TNode[],
  loc: t.SourceLocation | null | undefined
): TNode[];

function withLocation<TNode extends t.Node>(
  node: TNode | readonly TNode[],
  loc: t.SourceLocation | null | undefined
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
      ExportAllDeclaration(path: NodePath<t.ExportAllDeclaration>, state: State): void {
        state.exportAll.push({
          file: path.node.source.value,
          loc: path.node.loc,
        });

        path.remove();
      },

      ExportDefaultDeclaration(
        path: NodePath<t.ExportDefaultDeclaration>,
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

      ExportNamedDeclaration(path: NodePath<t.ExportNamedDeclaration>, state: State): void {
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
                      // @ts-expect-error Property 'key' does not exist on type 'RestElement'
                      const name = p.key.name;
                      state.exportNamed.push({ local: name, remote: name, loc });
                    });
                  }
                  break;
                case 'ArrayPattern':
                  {
                    const elements = d.id.elements;
                    elements.forEach((e) => {
                      // @ts-expect-error Property 'name' does not exist on type 'ArrayPattern'.
                      const name = e.name;
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
            const local = s.local;
            const remote = s.exported;

            if (remote.type === 'StringLiteral') {
              // https://babeljs.io/docs/en/babel-plugin-syntax-module-string-names
              throw path.buildCodeFrameError('Module string names are not supported');
            }

            if (path.node.source) {
              const temp = path.scope.generateUidIdentifier(local.name);

              if (local.name === 'default') {
                path.insertBefore(
                  withLocation(
                    importTemplate({
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
          let sharedModuleImport: t.Identifier;
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

            switch (s.type) {
              case 'ImportNamespaceSpecifier':
                state.imports.push({
                  node: withLocation(
                    importTemplate({
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
                    importTemplate({
                      IMPORT: t.cloneNode(state.importDefault),
                      FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                      LOCAL: t.cloneNode(local),
                    }),
                    loc
                  ),
                });
                break;

              case 'ImportSpecifier':
                if (imported.name === 'default') {
                  state.imports.push({
                    node: withLocation(
                      importTemplate({
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
        enter(path: NodePath<t.Program>, state: State): void {
          state.exportAll = [];
          state.exportDefault = [];
          state.exportNamed = [];

          state.imports = [];
          state.importAll = t.identifier(state.opts.importAll);
          state.importDefault = t.identifier(state.opts.importDefault);

          // Rename declarations at module scope that might otherwise conflict
          // with arguments we inject into the module factory.
          // Note that it isn't necessary to rename importAll/importDefault
          // because Metro already uses generateUid to generate unused names.
          ['module', 'global', 'exports', 'require'].forEach((name) => path.scope.rename(name));
        },

        exit(path: NodePath<t.Program>, state: State): void {
          const body = path.node.body;

          // state.imports = [node1, node2, node3, ...nodeN]
          state.imports.reverse().forEach((e: { node: t.Statement }) => {
            // import nodes are added to the top of the program body
            body.unshift(e.node);
          });

          state.exportDefault.forEach((e) => {
            body.push(
              withLocation(
                exportTemplate({
                  LOCAL: t.identifier(e.local),
                  REMOTE: t.identifier('default'),
                }),
                e.loc
              )
            );
          });

          state.exportAll.forEach((e) => {
            body.push(
              ...withLocation(
                exportAllTemplate({
                  FILE: resolvePath(t.stringLiteral(e.file), state.opts.resolve),
                  REQUIRED: path.scope.generateUidIdentifier(e.file),
                  KEY: path.scope.generateUidIdentifier('key'),
                }),
                e.loc
              )
            );
          });

          state.exportNamed.forEach((e) => {
            body.push(
              withLocation(
                exportTemplate({
                  LOCAL: t.identifier(e.local),
                  REMOTE: t.identifier(e.remote),
                }),
                e.loc
              )
            );
          });

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
