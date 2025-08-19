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
const debug = require('debug')('expo:metro-config:import-export-plugin');
function nullthrows(x, message) {
    (0, node_assert_1.default)(x != null, message);
    return x;
}
/**
 * Produces a Babel template that transforms an "import { x } from a" into
 * "var _a = require(a)" call which needs to be followed by
 * update of the "x" references to "_a.x".
 */
const importTemplate = core_1.template.statement(`
  var LOCAL = require(FILE);
`);
/**
 * Produces a Babel template that transforms an "import * as x from ..." or an
 * "import x from ..." call into a "const x = importAll(...)" call with the
 * corresponding id in it.
 */
const importAllTemplate = core_1.template.statement(`
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
// NOTE(@krystofwoldrich): Export all template doesn't have to check for export existence
// because it always runs before default and named exports which overwrite the exports object.
// NOTE(@krystofwoldrich): This also re-exports `default` and `__esModule` properties
// we might want to remove that in the future to align with the spec.
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
// NOTE(krystofwoldrich): for (var KEY in REQUIRED) { doesn't work here
/**
 * Produces an "export all" template that traverses all exported symbols and
 * re-exposes them.
 */
const liveBindExportAllTemplate = core_1.template.statements(`
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
const liveBindExportTemplate = core_1.template.statement(`
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
 * Creates static exported names array for the module.
 *
 * @example var _exportedNames = ['name1', 'name2', ...];
 */
const exportedNamesTemplate = ({ t: b, NAMES, IDENTIFIER, }) => {
    return b.variableDeclaration('var', [
        b.variableDeclarator(b.identifier(IDENTIFIER), b.objectExpression(NAMES.map((v) => b.objectProperty(b.stringLiteral(v), b.booleanLiteral(true))))),
    ]);
};
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
function withLocation(nodeOrArray, loc) {
    if (Array.isArray(nodeOrArray)) {
        return nodeOrArray.map((n) => withLocation(n, loc));
    }
    const node = nodeOrArray;
    if (!node.loc) {
        return { ...node, loc };
    }
    return node;
}
function importExportPlugin({ types: t, }) {
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
                const id = ('id' in declaration && declaration.id) || path.scope.generateUidIdentifier('default');
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
                                            const nameCandidate = p.type === 'ObjectProperty' ? p.value : p.argument;
                                            const name = 'name' in nameCandidate ? nameCandidate.name : undefined;
                                            if (name) {
                                                state.exportNamed.push({ local: name, remote: name, loc });
                                            }
                                            else {
                                                debug('Unexpected export named declaration with object pattern without name.', p.toString());
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
                                                state.exportNamed.push({ local: name, remote: name, loc });
                                            }
                                            else {
                                                debug('Unexpected export named declaration with array pattern without name.', e?.toString());
                                            }
                                        });
                                    }
                                    break;
                                default:
                                    {
                                        const id = d.id;
                                        const name = 'name' in id ? id.name : undefined;
                                        if (name) {
                                            state.exportNamed.push({ local: name, remote: name, loc });
                                        }
                                        else {
                                            debug('Unexpected export named declaration with identifier without name.', id.toString());
                                        }
                                    }
                                    break;
                            }
                        });
                    }
                    else {
                        if ('id' in declaration) {
                            const id = declaration.id || path.scope.generateUidIdentifier();
                            const name = id.type === 'StringLiteral' ? id.value : id.name;
                            declaration.id = id;
                            state.exportNamed.push({ local: name, remote: name, loc });
                        }
                        else {
                            debug('Unexpected export named declaration without id.', declaration.toString());
                        }
                    }
                    path.insertBefore(declaration);
                }
                const specifiers = path.node.specifiers;
                if (specifiers && specifiers.length) {
                    let sharedModuleExportFrom = null;
                    if (
                    // NOTE(@krystofwoldrich): If liveBindings are disabled we adhere to the original behavior at the moment
                    // meaning no shared imports for `export from`
                    this.opts.liveBindings &&
                        path.node.source &&
                        specifiers.filter((s) => s.type === 'ExportSpecifier' &&
                            (s.exported.type === 'StringLiteral' || s.local.name !== 'default')).length > 1) {
                        sharedModuleExportFrom = path.scope.generateUidIdentifierBasedOnNode(path.node.source);
                        path.insertBefore(withLocation(importTemplate({
                            FILE: resolvePath(t.cloneNode(nullthrows(path.node.source)), state.opts.resolve),
                            LOCAL: sharedModuleExportFrom,
                        }), loc));
                    }
                    specifiers.forEach((s) => {
                        let local = 'local' in s ? s.local : undefined;
                        const remote = s.exported;
                        // export * as b from 'a'
                        if (!local && s.type === 'ExportNamespaceSpecifier') {
                            local = s.exported;
                        }
                        if (!local) {
                            debug('Unexpected export named declaration specifier without local identifier.', s.toString());
                            return;
                        }
                        if (remote.type === 'StringLiteral') {
                            // https://babeljs.io/docs/en/babel-plugin-syntax-module-string-names
                            throw path.buildCodeFrameError('Module string names are not supported');
                        }
                        if (path.node.source) {
                            const temp = path.scope.generateUidIdentifierBasedOnNode(
                            // For live bindings, we need to create a require statement for the module namespace
                            state.opts.liveBindings ? path.node.source : local);
                            if (local.name === 'default') {
                                path.insertBefore(withLocation(importAllTemplate({
                                    IMPORT: s.type !== 'ExportNamespaceSpecifier'
                                        ? t.cloneNode(state.importDefault)
                                        : t.cloneNode(state.importAll),
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
                                if (state.opts.liveBindings) {
                                    if (!sharedModuleExportFrom) {
                                        // Only insert the require statement if not using the shared require
                                        path.insertBefore(withLocation(importTemplate({
                                            FILE: resolvePath(t.cloneNode(nullthrows(path.node.source)), state.opts.resolve),
                                            LOCAL: temp,
                                        }), loc));
                                    }
                                    state.exportDefault.push({
                                        namespace: sharedModuleExportFrom?.name ?? temp.name,
                                        local: local.name,
                                        loc,
                                    });
                                }
                                else {
                                    path.insertBefore(withLocation(importNamedTemplate({
                                        FILE: resolvePath(t.cloneNode(nullthrows(path.node.source)), state.opts.resolve),
                                        LOCAL: temp,
                                        REMOTE: local,
                                    }), loc));
                                    state.exportDefault.push({ local: temp.name, loc });
                                }
                            }
                            else if (s.type === 'ExportNamespaceSpecifier') {
                                if (!sharedModuleExportFrom) {
                                    path.insertBefore(withLocation(importAllTemplate({
                                        IMPORT: t.cloneNode(state.importAll),
                                        FILE: resolvePath(t.cloneNode(nullthrows(path.node.source)), state.opts.resolve),
                                        LOCAL: temp,
                                    }), loc));
                                }
                                state.exportNamed.push({
                                    local: sharedModuleExportFrom?.name ?? temp.name,
                                    remote: remote.name,
                                    loc,
                                });
                            }
                            else {
                                if (state.opts.liveBindings) {
                                    if (!sharedModuleExportFrom) {
                                        // Only insert the require statement if not using the shared require
                                        path.insertBefore(withLocation(importTemplate({
                                            FILE: resolvePath(t.cloneNode(nullthrows(path.node.source)), state.opts.resolve),
                                            LOCAL: temp,
                                        }), loc));
                                    }
                                    state.exportNamed.push({
                                        local: local.name,
                                        remote: remote.name,
                                        loc,
                                        namespace: sharedModuleExportFrom?.name ?? temp.name,
                                    });
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
                        }
                        else {
                            // Check if this identifier was imported and use live bindings if so
                            const importInfo = state.importedIdentifiers.get(local.name);
                            if (importInfo && state.opts.liveBindings) {
                                if (remote.name === 'default') {
                                    state.exportDefault.push({
                                        local: importInfo.imported,
                                        loc,
                                        namespace: importInfo.source,
                                    });
                                }
                                else {
                                    state.exportNamed.push({
                                        local: importInfo.imported,
                                        remote: remote.name,
                                        loc,
                                        namespace: importInfo.source,
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
                        // NOTE(krystofwoldrich): this can't be a template because the declaration type is needed later
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
                        const local = s.local;
                        const getLocalModule = () => sharedModuleImport ??
                            path.scope.generateUidIdentifier(file.value.replace(/[^a-zA-Z0-9]/g, '_'));
                        switch (s.type) {
                            case 'ImportNamespaceSpecifier':
                                state.imports.push({
                                    node: withLocation(importAllTemplate({
                                        IMPORT: t.cloneNode(state.importAll),
                                        FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                                        LOCAL: t.cloneNode(local),
                                    }), loc),
                                });
                                break;
                            case 'ImportDefaultSpecifier':
                                state.imports.push({
                                    node: withLocation(importAllTemplate({
                                        IMPORT: t.cloneNode(state.importDefault),
                                        FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                                        LOCAL: t.cloneNode(local),
                                    }), loc),
                                });
                                break;
                            case 'ImportSpecifier': {
                                const imported = s.imported;
                                const importedName = imported.type === 'StringLiteral' ? imported.value : imported.name;
                                const localModule = getLocalModule();
                                if (importedName !== 'default') {
                                    // NOTE(@krystofwoldrich): Imported identifiers are exported as live bindings
                                    // the plugin currently doesn't support live bindings for default imports
                                    state.importedIdentifiers.set(local.name, {
                                        source: localModule.name,
                                        imported: importedName,
                                    });
                                }
                                if (importedName === 'default') {
                                    state.imports.push({
                                        node: withLocation(importAllTemplate({
                                            IMPORT: t.cloneNode(state.importDefault),
                                            FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                                            LOCAL: t.cloneNode(local),
                                        }), loc),
                                    });
                                }
                                else if (sharedModuleVariableDeclaration != null) {
                                    if (state.opts.liveBindings) {
                                        state.namespaceForLocal.set(local.name, {
                                            namespace: localModule.name,
                                            remote: importedName,
                                        });
                                    }
                                    else {
                                        sharedModuleVariableDeclaration.declarations.push(withLocation(t.variableDeclarator(t.cloneNode(local), t.memberExpression(t.cloneNode(sharedModuleImport), t.cloneNode(imported))), loc));
                                    }
                                }
                                else {
                                    if (state.opts.liveBindings) {
                                        state.imports.push({
                                            node: withLocation(importTemplate({
                                                FILE: resolvePath(t.cloneNode(file), state.opts.resolve),
                                                LOCAL: t.cloneNode(localModule),
                                            }), loc),
                                        });
                                        state.namespaceForLocal.set(local.name, {
                                            namespace: localModule.name,
                                            remote: importedName,
                                        });
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
                                }
                                break;
                            }
                            default:
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
                    state.importedIdentifiers = new Map();
                    state.namespaceForLocal = new Map();
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
                    // NOTE(@krystofwoldrich): Export all must be first as exports without live bindings
                    // rely on overwriting the exports object by default and named exports.
                    state.exportAll.forEach((e) => {
                        if (state.opts.liveBindings) {
                            // Generate a static list of exported names to runtime overwrites
                            const exportedNamesIdentifier = path.scope.generateUidIdentifier('_exportedNames');
                            const exportedNames = exportedNamesTemplate({
                                t,
                                IDENTIFIER: exportedNamesIdentifier.name,
                                NAMES: state.exportNamed.map((e) => e.remote),
                            });
                            body.push(exportedNames);
                            body.push(...withLocation(liveBindExportAllTemplate({
                                FILE: resolvePath(t.stringLiteral(e.file), state.opts.resolve),
                                REQUIRED: path.scope.generateUidIdentifier(e.file),
                                KEY: path.scope.generateUidIdentifier('key'),
                                EXPORTED_NAMES: exportedNamesIdentifier,
                            }), e.loc));
                        }
                        else {
                            body.push(...withLocation(exportAllTemplate({
                                FILE: resolvePath(t.stringLiteral(e.file), state.opts.resolve),
                                REQUIRED: path.scope.generateUidIdentifier(e.file),
                                KEY: path.scope.generateUidIdentifier('key'),
                            }), e.loc));
                        }
                    });
                    state.exportDefault.forEach((e) => {
                        if (e.namespace) {
                            body.push(withLocation(liveBindExportTemplate({
                                REQUIRED: t.identifier(e.namespace),
                                LOCAL: t.identifier(e.local),
                                REMOTE: 'default',
                            }), e.loc));
                        }
                        else {
                            body.push(withLocation(exportTemplate({
                                LOCAL: t.identifier(e.local),
                                REMOTE: t.identifier('default'),
                            }), e.loc));
                        }
                    });
                    state.exportNamed.forEach((e) => {
                        if (e.namespace) {
                            body.push(withLocation(liveBindExportTemplate({
                                REQUIRED: t.identifier(e.namespace),
                                LOCAL: t.identifier(e.local),
                                REMOTE: e.remote,
                            }), e.loc));
                        }
                        else {
                            body.push(withLocation(exportTemplate({
                                LOCAL: t.identifier(e.local),
                                REMOTE: t.identifier(e.remote),
                            }), e.loc));
                        }
                    });
                    path.traverse({
                        ReferencedIdentifier(path, state) {
                            const localName = path.node.name;
                            const { namespace, remote } = state.namespaceForLocal.get(localName) ?? {};
                            // not from a namespace
                            if (!namespace || !remote)
                                return;
                            const localBinding = path.scope.getBinding(localName);
                            const rootBinding = state.programScope.getBinding(localName);
                            // redeclared in this scope
                            if (rootBinding !== localBinding)
                                return;
                            if (path.type === 'JSXIdentifier') {
                                path.replaceWith(t.jsxMemberExpression(t.jsxIdentifier(namespace), t.jsxIdentifier(remote)));
                            }
                            else {
                                // Identifier
                                path.replaceWith(t.memberExpression(t.identifier(namespace), t.identifier(remote)));
                            }
                        },
                    }, {
                        namespaceForLocal: state.namespaceForLocal,
                        programScope: path.scope,
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