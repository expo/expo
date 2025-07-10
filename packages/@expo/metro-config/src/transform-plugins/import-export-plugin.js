/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

'use strict';

import type {PluginObj} from '@babel/core';
import type {NodePath} from '@babel/traverse';
import type {
  ExportNamedDeclaration,
  ImportDeclaration,
  Node,
  Program,
  Statement,
} from '@babel/types';
// Type only dependency. This is not a runtime dependency
// eslint-disable-next-line import/no-extraneous-dependencies
import typeof * as Types from '@babel/types';

const template = require('@babel/template').default;
const nullthrows = require('nullthrows');

export type Options = $ReadOnly<{
  importDefault: string,
  importAll: string,
  resolve: boolean,
  out?: {isESModule: boolean, ...},
}>;

type State = {
  exportAll: Array<{file: string, loc: ?BabelSourceLocation, ...}>,
  exportDefault: Array<{local: string, loc: ?BabelSourceLocation, ...}>,
  exportNamed: Array<{
    local: string,
    remote: string,
    loc: ?BabelSourceLocation,
    ...
  }>,
  imports: Array<{node: Statement}>,
  importDefault: BabelNode,
  importAll: BabelNode,
  opts: Options,
  ...
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
function resolvePath<TNode: Node>(
  node: TNode,
  resolve: boolean,
): BabelNodeExpression | TNode {
  if (!resolve) {
    return node;
  }

  return resolveTemplate({
    NODE: node,
  });
}

declare function withLocation<TNode: BabelNode>(
  node: TNode,
  loc: ?BabelSourceLocation,
): TNode;

// eslint-disable-next-line no-redeclare
declare function withLocation<TNode: BabelNode>(
  node: $ReadOnlyArray<TNode>,
  loc: ?BabelSourceLocation,
): Array<TNode>;

// eslint-disable-next-line no-redeclare
/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
function withLocation(node, loc) {
  if (Array.isArray(node)) {
    return node.map(n => withLocation(n, loc));
  }
  if (!node.loc) {
    return {...node, loc};
  }
  return node;
}

function importExportPlugin({types: t}: {types: Types, ...}): PluginObj<State> {
  const {isDeclaration, isVariableDeclaration} = t;

  return {
    visitor: {
      ExportAllDeclaration(
        path: NodePath<BabelNodeExportAllDeclaration>,
        state: State,
      ): void {
        state.exportAll.push({
          file: path.node.source.value,
          loc: path.node.loc,
        });

        path.remove();
      },

      ExportDefaultDeclaration(
        path: NodePath<BabelNodeExportDefaultDeclaration>,
        state: State,
      ): void {
        const declaration = path.node.declaration;
        const id =
          declaration.id || path.scope.generateUidIdentifier('default');

        // $FlowFixMe Flow error uncovered by typing Babel more strictly
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
            withLocation(
              t.variableDeclaration('var', [
                t.variableDeclarator(id, declaration),
              ]),
              loc,
            ),
          );
        }

        path.remove();
      },

      ExportNamedDeclaration(
        path: NodePath<ExportNamedDeclaration>,
        state: State,
      ): void {
        if (path.node.exportKind && path.node.exportKind !== 'value') {
          return;
        }

        const declaration = path.node.declaration;
        const loc = path.node.loc;

        if (declaration) {
          if (isVariableDeclaration(declaration)) {
            declaration.declarations.forEach(d => {
              switch (d.id.type) {
                case 'ObjectPattern':
                  {
                    const properties = d.id.properties;
                    properties.forEach(p => {
                      // $FlowFixMe Flow error uncovered by typing Babel more strictly
                      const name = p.key.name;
                      // $FlowFixMe[incompatible-call]
                      state.exportNamed.push({local: name, remote: name, loc});
                    });
                  }
                  break;
                case 'ArrayPattern':
                  {
                    const elements = d.id.elements;
                    elements.forEach(e => {
                      // $FlowFixMe Flow error uncovered by typing Babel more strictly
                      const name = e.name;
                      // $FlowFixMe[incompatible-call]
                      state.exportNamed.push({local: name, remote: name, loc});
                    });
                  }
                  break;
                default:
                  {
                    const name = d.id.name;
                    // $FlowFixMe[incompatible-call]
                    state.exportNamed.push({local: name, remote: name, loc});
                  }
                  break;
              }
            });
          } else {
            const id = declaration.id || path.scope.generateUidIdentifier();
            const name = id.name;

            // $FlowFixMe Flow error uncovered by typing Babel more strictly
            declaration.id = id;
            // $FlowFixMe[incompatible-call]
            state.exportNamed.push({local: name, remote: name, loc});
          }

          path.insertBefore(declaration);
        }

        const specifiers = path.node.specifiers;
        if (specifiers) {
          specifiers.forEach(s => {
            const local = s.local;
            const remote = s.exported;

            if (remote.type === 'StringLiteral') {
              // https://babeljs.io/docs/en/babel-plugin-syntax-module-string-names
              throw path.buildCodeFrameError<$FlowFixMeEmpty>(
                'Module string names are not supported',
              );
            }

            if (path.node.source) {
              // $FlowFixMe[incompatible-use]
              const temp = path.scope.generateUidIdentifier(local.name);

              // $FlowFixMe[incompatible-type]
              // $FlowFixMe[incompatible-use]
              if (local.name === 'default') {
                path.insertBefore(
                  withLocation(
                    importTemplate({
                      IMPORT: t.cloneNode(state.importDefault),
                      FILE: resolvePath(
                        t.cloneNode(nullthrows(path.node.source)),
                        state.opts.resolve,
                      ),
                      LOCAL: temp,
                    }),
                    loc,
                  ),
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
                        state.opts.resolve,
                      ),
                      LOCAL: temp,
                      REMOTE: local,
                    }),
                    loc,
                  ),
                );

                state.exportDefault.push({local: temp.name, loc});
              } else {
                path.insertBefore(
                  withLocation(
                    importNamedTemplate({
                      FILE: resolvePath(
                        t.cloneNode(nullthrows(path.node.source)),
                        state.opts.resolve,
                      ),
                      LOCAL: temp,
                      REMOTE: local,
                    }),
                    loc,
                  ),
                );

                state.exportNamed.push({
                  local: temp.name,
                  remote: remote.name,
                  loc,
                });
              }
            } else {
              if (remote.name === 'default') {
                // $FlowFixMe[incompatible-use]
                state.exportDefault.push({local: local.name, loc});
              } else {
                state.exportNamed.push({
                  // $FlowFixMe[incompatible-use]
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
              loc,
            ),
          });
        } else {
          let sharedModuleImport;
          let sharedModuleVariableDeclaration = null;
          if (
            specifiers.filter(
              s =>
                s.type === 'ImportSpecifier' &&
                (s.imported.type === 'StringLiteral' ||
                  s.imported.name !== 'default'),
            ).length > 1
          ) {
            sharedModuleImport =
              path.scope.generateUidIdentifierBasedOnNode(file);
            sharedModuleVariableDeclaration = withLocation(
              t.variableDeclaration('var', [
                t.variableDeclarator(
                  t.cloneNode(sharedModuleImport),
                  t.callExpression(t.identifier('require'), [
                    resolvePath(t.cloneNode(file), state.opts.resolve),
                  ]),
                ),
              ]),
              loc,
            );
            state.imports.push({node: sharedModuleVariableDeclaration});
          }

          specifiers.forEach(s => {
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
                    loc,
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
                    loc,
                  ),
                });
                break;

              case 'ImportSpecifier':
                // $FlowFixMe[incompatible-type]
                // $FlowFixMe[incompatible-use]
                if (imported.name === 'default') {
                  state.imports.push({
                    node: withLocation(
                      importTemplate({
                        IMPORT: t.cloneNode(state.importDefault),
                        FILE: resolvePath(
                          t.cloneNode(file),
                          state.opts.resolve,
                        ),
                        LOCAL: t.cloneNode(local),
                      }),
                      loc,
                    ),
                  });
                } else if (sharedModuleVariableDeclaration != null) {
                  sharedModuleVariableDeclaration.declarations.push(
                    withLocation(
                      t.variableDeclarator(
                        t.cloneNode(local),
                        t.memberExpression(
                          t.cloneNode(sharedModuleImport),
                          // $FlowFixMe[incompatible-call]
                          t.cloneNode(imported),
                        ),
                      ),
                      loc,
                    ),
                  );
                } else {
                  state.imports.push({
                    node: withLocation(
                      importNamedTemplate({
                        FILE: resolvePath(
                          t.cloneNode(file),
                          state.opts.resolve,
                        ),
                        LOCAL: t.cloneNode(local),
                        REMOTE: t.cloneNode(imported),
                      }),
                      loc,
                    ),
                  });
                }
                break;

              default:
                throw new TypeError('Unknown import type: ' + s.type);
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

          // Rename declarations at module scope that might otherwise conflict
          // with arguments we inject into the module factory.
          // Note that it isn't necessary to rename importAll/importDefault
          // because Metro already uses generateUid to generate unused names.
          ['module', 'global', 'exports', 'require'].forEach(name =>
            path.scope.rename(name),
          );
        },

        exit(path: NodePath<Program>, state: State): void {
          const body = path.node.body;

          // state.imports = [node1, node2, node3, ...nodeN]
          state.imports.reverse().forEach((e: {node: Statement}) => {
            // import nodes are added to the top of the program body
            body.unshift(e.node);
          });

          state.exportDefault.forEach(
            (e: {local: string, loc: ?BabelSourceLocation, ...}) => {
              body.push(
                withLocation(
                  exportTemplate({
                    LOCAL: t.identifier(e.local),
                    REMOTE: t.identifier('default'),
                  }),
                  e.loc,
                ),
              );
            },
          );

          state.exportAll.forEach(
            (e: {file: string, loc: ?BabelSourceLocation, ...}) => {
              body.push(
                // $FlowFixMe[incompatible-call]
                ...withLocation(
                  exportAllTemplate({
                    FILE: resolvePath(
                      t.stringLiteral(e.file),
                      state.opts.resolve,
                    ),
                    REQUIRED: path.scope.generateUidIdentifier(e.file),
                    KEY: path.scope.generateUidIdentifier('key'),
                  }),
                  e.loc,
                ),
              );
            },
          );

          state.exportNamed.forEach(
            (e: {
              local: string,
              remote: string,
              loc: ?BabelSourceLocation,
              ...
            }) => {
              body.push(
                withLocation(
                  exportTemplate({
                    LOCAL: t.identifier(e.local),
                    REMOTE: t.identifier(e.remote),
                  }),
                  e.loc,
                ),
              );
            },
          );

          if (
            state.exportDefault.length ||
            state.exportAll.length ||
            state.exportNamed.length
          ) {
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

module.exports = importExportPlugin;
