"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importExportPlugin = importExportPlugin;
const core_1 = require("@babel/core");
const node_assert_1 = __importDefault(require("node:assert"));
function nullthrows(x, message) {
    (0, node_assert_1.default)(x != null, message);
    return x;
}
/**
 * Produces a Babel template that transforms an "import * as x from ..." or an
 * "import x from ..." call into a "const x = importAll(...)" call with the
 * corresponding id in it.
 */
const importTemplate = core_1.template.statement(`
  var LOCAL = IMPORT(FILE);
`);
/**
 * Produces a Babel template that transforms an "import {x as y} from ..." into
 * "const y = require(...).x" call with the corresponding id in it.
 */
const importNamedTemplate = core_1.template.statement(`
  var LOCAL = require(FILE).REMOTE;
`);
/**
 * Produces a Babel template that transforms an "import ..." into
 * "require(...)", which is considered a side-effect call.
 */
const importSideEffectTemplate = core_1.template.statement(`
  require(FILE);
`);
/**
 * Produces an "export all" template that traverses all exported symbols and
 * re-exposes them.
 */
const exportAllTemplate = core_1.template.statements(`
  var REQUIRED = require(FILE);

  for (var KEY in REQUIRED) {
    exports[KEY] = REQUIRED[KEY];
  }
`);
/**
 * Produces a "named export" or "default export" template to export a single
 * symbol.
 */
const exportTemplate = core_1.template.statement(`
  exports.REMOTE = LOCAL;
`);
/**
 * Flags the exported module as a transpiled ES module. Needs to be kept in 1:1
 * compatibility with Babel.
 */
const esModuleExportTemplate = core_1.template.statement(`
  Object.defineProperty(exports, '__esModule', {value: true});
`);
/**
 * Resolution template in case it is requested.
 */
const resolveTemplate = core_1.template.expression(`
  require.resolve(NODE)
`);
/**
 * Enforces the resolution of a path to a fully-qualified one, if set.
 */
function resolvePath(node, resolve) {
    if (!resolve) {
        return node;
    }
    return resolveTemplate({
        NODE: node,
    });
}
function withLocation(node, loc) {
    if (Array.isArray(node)) {
        return node.map((n) => withLocation(n, loc));
    }
    // TODO: improve types
    if (!node.loc) {
        return { ...node, loc };
    }
    return node;
}
function importExportPlugin({ types: t }) {
    const { isDeclaration, isVariableDeclaration } = t;
    return {
        visitor: {
            ExportAllDeclaration(path, state) {
                state.exportAll.push({
                    file: path.node.source.value,
                    loc: path.node.loc,
                });
                path.remove();
            },
            ExportDefaultDeclaration(path, state) {
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
                }
                else {
                    path.insertBefore(withLocation(t.variableDeclaration('var', [t.variableDeclarator(id, declaration)]), loc));
                }
                path.remove();
            },
            ExportNamedDeclaration(path, state) {
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
                    }
                    else {
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
                                path.insertBefore(withLocation(importTemplate({
                                    IMPORT: t.cloneNode(state.importDefault),
                                    FILE: resolvePath(t.cloneNode(nullthrows(path.node.source)), state.opts.resolve),
                                    LOCAL: temp,
                                }), loc));
                                state.exportNamed.push({
                                    local: temp.name,
                                    remote: remote.name,
                                    loc,
                                });
                            }
                            else if (remote.name === 'default') {
                                path.insertBefore(withLocation(importNamedTemplate({
                                    FILE: resolvePath(t.cloneNode(nullthrows(path.node.source)), state.opts.resolve),
                                    LOCAL: temp,
                                    REMOTE: local,
                                }), loc));
                                state.exportDefault.push({ local: temp.name, loc });
                            }
                            else {
                                path.insertBefore(withLocation(importNamedTemplate({
                                    FILE: resolvePath(t.cloneNode(nullthrows(path.node.source)), state.opts.resolve),
                                    LOCAL: temp,
                                    REMOTE: local,
                                }), loc));
                                state.exportNamed.push({
                                    local: temp.name,
                                    remote: remote.name,
                                    loc,
                                });
                            }
                        }
                        else {
                            if (remote.name === 'default') {
                                state.exportDefault.push({ local: local.name, loc });
                            }
                            else {
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
            ImportDeclaration(path, state) {
                if (path.node.importKind && path.node.importKind !== 'value') {
                    return;
                }
                const file = path.node.source;
                const specifiers = path.node.specifiers;
                const loc = path.node.loc;
                if (!specifiers.length) {
                    state.imports.push({
                        node: withLocation(importSideEffectTemplate({
                            FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                        }), loc),
                    });
                }
                else {
                    let sharedModuleImport;
                    let sharedModuleVariableDeclaration = null;
                    if (specifiers.filter((s) => s.type === 'ImportSpecifier' &&
                        (s.imported.type === 'StringLiteral' || s.imported.name !== 'default')).length > 1) {
                        sharedModuleImport = path.scope.generateUidIdentifierBasedOnNode(file);
                        sharedModuleVariableDeclaration = withLocation(t.variableDeclaration('var', [
                            t.variableDeclarator(t.cloneNode(sharedModuleImport), t.callExpression(t.identifier('require'), [
                                resolvePath(t.cloneNode(file), state.opts.resolve),
                            ])),
                        ]), loc);
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
                                    node: withLocation(importTemplate({
                                        IMPORT: t.cloneNode(state.importAll),
                                        FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                                        LOCAL: t.cloneNode(local),
                                    }), loc),
                                });
                                break;
                            case 'ImportDefaultSpecifier':
                                state.imports.push({
                                    node: withLocation(importTemplate({
                                        IMPORT: t.cloneNode(state.importDefault),
                                        FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                                        LOCAL: t.cloneNode(local),
                                    }), loc),
                                });
                                break;
                            case 'ImportSpecifier':
                                if (imported.name === 'default') {
                                    state.imports.push({
                                        node: withLocation(importTemplate({
                                            IMPORT: t.cloneNode(state.importDefault),
                                            FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                                            LOCAL: t.cloneNode(local),
                                        }), loc),
                                    });
                                }
                                else if (sharedModuleVariableDeclaration != null) {
                                    sharedModuleVariableDeclaration.declarations.push(withLocation(t.variableDeclarator(t.cloneNode(local), t.memberExpression(t.cloneNode(sharedModuleImport), t.cloneNode(imported))), loc));
                                }
                                else {
                                    state.imports.push({
                                        node: withLocation(importNamedTemplate({
                                            FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                                            LOCAL: t.cloneNode(local),
                                            REMOTE: t.cloneNode(imported),
                                        }), loc),
                                    });
                                }
                                break;
                            default:
                                // TODO: improve types
                                throw new TypeError('Unknown import type: ' + s.type);
                        }
                    });
                }
                path.remove();
            },
            Program: {
                enter(path, state) {
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
                exit(path, state) {
                    const body = path.node.body;
                    // state.imports = [node1, node2, node3, ...nodeN]
                    state.imports.reverse().forEach((e) => {
                        // import nodes are added to the top of the program body
                        body.unshift(e.node);
                    });
                    state.exportDefault.forEach((e) => {
                        body.push(withLocation(exportTemplate({
                            LOCAL: t.identifier(e.local),
                            REMOTE: t.identifier('default'),
                        }), e.loc));
                    });
                    state.exportAll.forEach((e) => {
                        body.push(...withLocation(exportAllTemplate({
                            FILE: resolvePath(t.stringLiteral(e.file), state.opts.resolve),
                            REQUIRED: path.scope.generateUidIdentifier(e.file),
                            KEY: path.scope.generateUidIdentifier('key'),
                        }), e.loc));
                    });
                    state.exportNamed.forEach((e) => {
                        body.push(withLocation(exportTemplate({
                            LOCAL: t.identifier(e.local),
                            REMOTE: t.identifier(e.remote),
                        }), e.loc));
                    });
                    if (state.exportDefault.length || state.exportAll.length || state.exportNamed.length) {
                        body.unshift(esModuleExportTemplate());
                        if (state.opts.out) {
                            state.opts.out.isESModule = true;
                        }
                    }
                    else if (state.opts.out) {
                        state.opts.out.isESModule = false;
                    }
                },
            },
        },
    };
}
//# sourceMappingURL=import-export-plugin.js.map