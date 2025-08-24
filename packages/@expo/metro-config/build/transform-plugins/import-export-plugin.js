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
function getArray(map, key) {
    if (!map.has(key)) {
        map.set(key, []);
    }
    return nullthrows(map.get(key));
}
function setFirst(map, key, value) {
    if (!map.has(key)) {
        map.set(key, value);
    }
}
const requireTemplate = core_1.template.statement(`
  var %%asId%% = require(%%moduleStr%%);
`);
const importTemplate = core_1.template.statement(`
  var %%asId%% = %%importHelperId%%(%%moduleStr%%);
`);
const requireNameTemplate = core_1.template.statement(`
  var %%asId%% = require(%%moduleStr%%).%%nameId%%;
`);
const requireSideEffectTemplate = core_1.template.statement(`
  require(%%moduleStr%%);
`);
// NOTE(@krystofwoldrich): Export all template doesn't have to check for export existence
// because it always runs before default and named exports which overwrite the exports object.
// NOTE(@krystofwoldrich): This also re-exports `default` and `__esModule` properties
// we might want to remove that in the future to align with the spec.
const staticExportAllTemplate = core_1.template.statements(`
  var %%namespaceId%% = require(%%moduleStr%%);

  for (var %%keyId%% in %%namespaceId%%) {
    exports[%%keyId%%] = %%namespaceId%%[%%keyId%%];
  }
`);
const staticExportTemplate = core_1.template.statement(`
  exports.%%asId%% = %%nameId%%;
`);
// NOTE(krystofwoldrich): for (var KEY in REQUIRED) { doesn't work here
const liveBindExportAllTemplate = core_1.template.statements(`
  var %%namespaceId%% = require(%%moduleStr%%);

  Object.keys(%%namespaceId%%).forEach(function (%%keyId%%) {
    if (%%keyId%% === "default" || %%keyId%% === "__esModule") return;
    if (Object.prototype.hasOwnProperty.call(%%exportedNamesId%%, %%keyId%%)) return;
    if (%%keyId%% in exports && exports[%%keyId%%] === %%namespaceId%%[%%keyId%%]) return;
    Object.defineProperty(exports, %%keyId%%, {
      enumerable: true,
      get: function () {
        return %%namespaceId%%[%%keyId%%];
      }
    });
  });
`);
const liveBindExportTemplate = core_1.template.statement(`
  Object.defineProperty(exports, %%asStr%%, {
    enumerable: true,
    get: function () {
      return %%namespaceId%%.%%namespaceNameId%%;
    }
  });
`);
const liveBindExportDefaultTemplate = core_1.template.statement(`
  Object.defineProperty(exports, %%asStr%%, {
    enumerable: true,
    get: function () {
      return (function (m) {
        return m && m.__esModule ? m.default : m
      })(%%namespaceId%%);
    }
  });
`);
// Needs to be kept in 1:1 compatibility with Babel.
const esModuleExportTemplate = core_1.template.statement(`
  Object.defineProperty(exports, '__esModule', {value: true});
`);
const resolveTemplate = core_1.template.expression(`
  require.resolve(NODE)
`);
/**
 * Creates static exported names array for the module.
 *
 * @example var _exportedNames = {'name1': true, 'name2': true, ...};
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
                setFirst(state.originalImportOrder, path.node.source.value, path.node.source);
                state.exportAllFrom.set(path.node.source.value, {
                    loc: path.node.loc,
                });
                path.remove();
            },
            ExportDefaultDeclaration(path, state) {
                const declaration = path.node.declaration;
                const id = ('id' in declaration && declaration.id) || path.scope.generateUidIdentifier('default');
                declaration.id = id;
                const loc = path.node.loc;
                if (isDeclaration(declaration)) {
                    path.insertBefore(withLocation(declaration, loc));
                }
                else {
                    path.insertBefore(withLocation(t.variableDeclaration('var', [t.variableDeclarator(id, declaration)]), loc));
                }
                state.exportDefault.push({
                    name: id.name,
                    loc,
                });
                path.remove();
            },
            ExportNamedDeclaration(path, state) {
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
                                                state.exportNamed.push({
                                                    name,
                                                    as: name,
                                                    loc,
                                                });
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
                                            state.exportNamed.push({
                                                name,
                                                as: name,
                                                loc,
                                            });
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
                            state.exportNamed.push({
                                name,
                                as: name,
                                loc,
                            });
                        }
                        else {
                            debug('Unexpected export named declaration without id.', declaration.toString());
                        }
                    }
                    path.insertBefore(declaration);
                }
                const specifiers = path.node.specifiers;
                if (specifiers && specifiers.length) {
                    const source = path.node.source;
                    if (source)
                        setFirst(state.originalImportOrder, source.value, source);
                    specifiers.forEach((s) => {
                        if (s.exported.type === 'StringLiteral') {
                            // https://babeljs.io/docs/en/babel-plugin-syntax-module-string-names
                            throw path.buildCodeFrameError('Module string names are not supported');
                        }
                        switch (s.type) {
                            case 'ExportSpecifier':
                                (source ? getArray(state.exportNamedFrom, source.value) : state.exportNamed).push({
                                    name: s.local.name,
                                    as: s.exported.name,
                                    loc: path.node.loc,
                                });
                                break;
                            case 'ExportDefaultSpecifier':
                                state.exportDefault.push({
                                    name: s.exported.name,
                                    loc: path.node.loc,
                                });
                                break;
                            case 'ExportNamespaceSpecifier':
                                // export * as b from 'a'
                                getArray(state.exportAllFromAs, nullthrows(source?.value)).push({
                                    as: s.exported.name,
                                    loc: path.node.loc,
                                });
                                break;
                            default:
                                debug('Unexpected export named declaration specifier type.', s.toString());
                                break;
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
                setFirst(state.originalImportOrder, file.value, file);
                if (!specifiers.length) {
                    state.importSideEffect.set(file.value, { loc });
                }
                else {
                    specifiers.forEach((s) => {
                        switch (s.type) {
                            case 'ImportNamespaceSpecifier':
                                getArray(state.importAllFromAs, file.value).push({
                                    as: s.local.name,
                                    loc: path.node.loc,
                                });
                                break;
                            case 'ImportDefaultSpecifier':
                                getArray(state.importDefaultFromAs, file.value).push({
                                    as: s.local,
                                    loc: path.node.loc,
                                });
                                break;
                            case 'ImportSpecifier': {
                                const importedName = s.imported.type === 'StringLiteral' ? s.imported.value : s.imported.name;
                                if (importedName === 'default') {
                                    getArray(state.importDefaultFromAs, file.value).push({
                                        as: s.local,
                                        loc: path.node.loc,
                                    });
                                }
                                else {
                                    getArray(state.importNamedFrom, file.value).push({
                                        name: importedName,
                                        as: s.local.name,
                                        loc: path.node.loc,
                                    });
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
                    state.originalImportOrder = new Map();
                    state.exportAllFrom = new Map();
                    state.importAllFromAs = new Map();
                    state.exportAllFromAs = new Map();
                    state.importDefaultFromAs = new Map();
                    state.exportDefault = [];
                    state.exportNamedFrom = new Map();
                    state.importNamedFrom = new Map();
                    state.exportNamed = [];
                    state.importSideEffect = new Map();
                    // Rename declarations at module scope that might otherwise conflict
                    // with arguments we inject into the module factory.
                    // Note that it isn't necessary to rename importAll/importDefault
                    // because Metro already uses generateUid to generate unused names.
                    ['module', 'global', 'exports', 'require'].forEach((name) => path.scope.rename(name));
                },
                exit(path, state) {
                    const body = path.node.body;
                    const hasEsmExports = state.exportDefault.length ||
                        state.exportAllFrom.size ||
                        state.exportNamed.length ||
                        state.exportAllFromAs.size ||
                        state.exportNamedFrom.size;
                    if (state.opts.liveBindings) {
                        const _namespaceForLocal = new Map();
                        const liveExports = [];
                        const exportAll = [];
                        const imports = [];
                        const staticExports = [];
                        const defaultStaticExports = [];
                        const exportedNames = new Set();
                        for (const e of state.exportAllFromAs.values()) {
                            for (const { as } of e) {
                                exportedNames.add(as);
                            }
                        }
                        for (const e of state.exportNamedFrom.values()) {
                            for (const { as } of e) {
                                exportedNames.add(as);
                            }
                        }
                        for (const { as } of state.exportNamed) {
                            exportedNames.add(as);
                        }
                        const exportedNamesIdentifier = path.scope.generateUidIdentifier('_exportedNames');
                        if (state.exportAllFrom.size) {
                            // Generate a static list of exported names to runtime overwrites;
                            liveExports.push(exportedNamesTemplate({
                                t,
                                IDENTIFIER: exportedNamesIdentifier.name,
                                NAMES: [...exportedNames],
                            }));
                        }
                        for (const [, module] of state.originalImportOrder) {
                            const resolved = resolvePath(module, state.opts.resolve);
                            let namespace = null;
                            const importModuleNamespace = (loc) => {
                                const _namespace = path.scope.generateUidIdentifierBasedOnNode(module);
                                imports.push(withLocation(requireTemplate({
                                    moduleStr: t.cloneNode(resolved),
                                    asId: t.cloneNode(_namespace),
                                }), loc));
                                return _namespace;
                            };
                            const exportAllFrom = state.exportAllFrom.get(module.value);
                            if (exportAllFrom) {
                                // export * from 'module'
                                namespace = path.scope.generateUidIdentifier(module.value);
                                exportAll.push(...withLocation(liveBindExportAllTemplate({
                                    keyId: path.scope.generateUidIdentifier('key'),
                                    moduleStr: t.cloneNode(resolved),
                                    namespaceId: t.cloneNode(namespace),
                                    exportedNamesId: t.cloneNode(exportedNamesIdentifier),
                                }), exportAllFrom.loc));
                            }
                            for (const { as, loc } of getArray(state.exportAllFromAs, module.value)) {
                                // export * as name from 'module'
                                const importAllNamespace = path.scope.generateUidIdentifier(module.value);
                                imports.push(withLocation(importTemplate({
                                    importHelperId: t.cloneNode(state.importAll),
                                    moduleStr: t.cloneNode(resolved),
                                    asId: t.cloneNode(importAllNamespace),
                                }), loc));
                                staticExports.push(withLocation(staticExportTemplate({
                                    nameId: t.cloneNode(importAllNamespace),
                                    asId: t.identifier(as),
                                }), loc));
                            }
                            for (const { name, as, loc } of getArray(state.exportNamedFrom, module.value)) {
                                if (!namespace) {
                                    namespace = importModuleNamespace(loc);
                                }
                                if (name === 'default') {
                                    // export { default as name } from 'module'
                                    liveExports.push(withLocation(liveBindExportDefaultTemplate({
                                        namespaceId: t.cloneNode(namespace),
                                        asStr: t.stringLiteral(as),
                                    }), loc));
                                }
                                else {
                                    // export { old as new } from 'module'
                                    liveExports.push(withLocation(liveBindExportTemplate({
                                        namespaceId: t.cloneNode(namespace),
                                        namespaceNameId: t.identifier(name),
                                        asStr: t.stringLiteral(as),
                                    }), loc));
                                }
                            }
                            for (const { name, as, loc } of getArray(state.importNamedFrom, module.value)) {
                                // import { one as two } from 'module'
                                if (!namespace) {
                                    namespace = importModuleNamespace(loc);
                                }
                                _namespaceForLocal.set(as, {
                                    namespace: namespace.name,
                                    name,
                                });
                            }
                            if (!namespace && state.importSideEffect.has(module.value)) {
                                // import 'module'
                                imports.push(withLocation(requireSideEffectTemplate({
                                    moduleStr: t.cloneNode(resolved),
                                }), state.importSideEffect.get(module.value)?.loc));
                            }
                            for (const { as, loc } of getArray(state.importAllFromAs, module.value)) {
                                // import * as name from 'module'
                                imports.push(withLocation(importTemplate({
                                    importHelperId: t.cloneNode(state.importAll),
                                    moduleStr: t.cloneNode(resolved),
                                    asId: t.identifier(as),
                                }), loc));
                            }
                            for (const { as, loc } of getArray(state.importDefaultFromAs, module.value)) {
                                // import name from 'module' (or import { default as name } from 'module')
                                if (exportedNames.has(as.name)) {
                                    if (!namespace) {
                                        namespace = importModuleNamespace(loc);
                                    }
                                    _namespaceForLocal.set(as.name, {
                                        namespace: namespace.name,
                                        name: 'default',
                                    });
                                }
                                // We need this to preserve the local default variable in case it's used
                                imports.push(withLocation(importTemplate({
                                    importHelperId: t.cloneNode(state.importDefault),
                                    moduleStr: t.cloneNode(resolved),
                                    asId: as,
                                }), loc));
                            }
                        }
                        for (const { name, as, loc } of state.exportNamed) {
                            const namespace = _namespaceForLocal.get(name);
                            if (namespace && namespace.name === 'default') {
                                // import name from 'module'; (or import { default as name } from 'module')
                                // export { name }
                                // To avoid overwriting local use of the import default variable
                                _namespaceForLocal.delete(name);
                                liveExports.push(withLocation(liveBindExportDefaultTemplate({
                                    namespaceId: t.identifier(namespace.namespace),
                                    asStr: t.stringLiteral(as),
                                }), loc));
                            }
                            else if (namespace) {
                                // import {name} from 'module';
                                // export { name as newName }
                                liveExports.push(withLocation(liveBindExportTemplate({
                                    namespaceId: t.identifier(namespace.namespace),
                                    namespaceNameId: t.identifier(namespace.name),
                                    asStr: t.stringLiteral(as),
                                }), loc));
                            }
                            else {
                                // export const name = 'value';
                                staticExports.push(withLocation(staticExportTemplate({
                                    nameId: t.identifier(name),
                                    asId: t.identifier(as),
                                }), loc));
                            }
                        }
                        for (const { name, loc } of state.exportDefault) {
                            defaultStaticExports.push(withLocation(staticExportTemplate({
                                nameId: t.identifier(name),
                                asId: t.identifier('default'),
                            }), loc));
                        }
                        body.unshift(...imports);
                        body.unshift(...exportAll);
                        body.unshift(...liveExports);
                        // program body
                        body.push(...staticExports);
                        body.push(...defaultStaticExports);
                        path.traverse({
                            ReferencedIdentifier(path, state) {
                                const localName = path.node.name;
                                const { namespace, name } = state.namespaceForLocal.get(localName) ?? {};
                                // not from a namespace
                                if (!namespace || !name)
                                    return;
                                const localBinding = path.scope.getBinding(localName);
                                const rootBinding = state.programScope.getBinding(localName);
                                // redeclared in this scope
                                if (rootBinding !== localBinding)
                                    return;
                                if (path.type === 'JSXIdentifier') {
                                    path.replaceWith(t.jsxMemberExpression(t.jsxIdentifier(namespace), t.jsxIdentifier(name)));
                                }
                                else {
                                    // Identifier
                                    path.replaceWith(t.memberExpression(t.identifier(namespace), t.identifier(name)));
                                }
                            },
                        }, {
                            namespaceForLocal: _namespaceForLocal,
                            programScope: path.scope,
                        });
                    }
                    else {
                        const imports = [];
                        const exportAll = [];
                        const staticExports = [];
                        const defaultStaticExports = [];
                        for (const [, module] of state.originalImportOrder) {
                            const resolved = resolvePath(module, state.opts.resolve);
                            const exportAllFrom = state.exportAllFrom.get(module.value);
                            if (exportAllFrom) {
                                // export * from 'module'
                                exportAll.push(...withLocation(staticExportAllTemplate({
                                    keyId: path.scope.generateUidIdentifier('key'),
                                    moduleStr: t.cloneNode(resolved),
                                    namespaceId: path.scope.generateUidIdentifier(module.value),
                                }), exportAllFrom.loc));
                            }
                            for (const { as, loc } of getArray(state.exportAllFromAs, module.value)) {
                                // export * as name from 'module' -> var _name = _$$_IMPORT_ALL('module'); exports.name = _name;
                                const ns = path.scope.generateUidIdentifier(as);
                                imports.push(withLocation(importTemplate({
                                    importHelperId: t.cloneNode(state.importAll),
                                    moduleStr: t.cloneNode(resolved),
                                    asId: t.cloneNode(ns),
                                }), loc));
                                // NOTE: To move all defaults to bottom of the program, we should check as === 'default' here
                                // but the original plugin doesn't do that.
                                staticExports.push(withLocation(staticExportTemplate({
                                    nameId: t.cloneNode(ns),
                                    asId: t.identifier(as),
                                }), loc));
                            }
                            for (const { name, as, loc } of getArray(state.exportNamedFrom, module.value)) {
                                if (name === 'default' && as === 'default') {
                                    // export { default } from 'module' -> exports.default = requireDefault('module');
                                    const tmp = path.scope.generateUidIdentifier(name);
                                    imports.push(withLocation(importTemplate({
                                        importHelperId: t.cloneNode(state.importDefault),
                                        moduleStr: t.cloneNode(resolved),
                                        asId: t.cloneNode(tmp),
                                    }), loc));
                                    defaultStaticExports.push(withLocation(staticExportTemplate({
                                        nameId: t.cloneNode(tmp),
                                        asId: t.identifier(as),
                                    }), loc));
                                }
                                else if (name === 'default') {
                                    // export { default as name } from 'module' -> var _default = requireDefault('module'); exports.name = _default;
                                    const tmp = path.scope.generateUidIdentifier(name);
                                    imports.push(withLocation(importTemplate({
                                        importHelperId: t.cloneNode(state.importDefault),
                                        moduleStr: t.cloneNode(resolved),
                                        asId: t.cloneNode(tmp),
                                    }), loc));
                                    staticExports.push(withLocation(staticExportTemplate({
                                        nameId: t.cloneNode(tmp),
                                        asId: t.identifier(as),
                                    }), loc));
                                }
                                else {
                                    // export { one as two } from 'module' -> var _one = require('module').one; exports.two = _one;
                                    const tmp = path.scope.generateUidIdentifier(name);
                                    imports.push(withLocation(requireNameTemplate({
                                        moduleStr: t.cloneNode(resolved),
                                        nameId: t.identifier(name),
                                        asId: t.cloneNode(tmp),
                                    }), loc));
                                    staticExports.push(withLocation(staticExportTemplate({
                                        nameId: t.cloneNode(tmp),
                                        asId: t.identifier(as),
                                    }), loc));
                                }
                            }
                            let sharedModuleVariableDeclaration = null;
                            if (getArray(state.importNamedFrom, module.value).length === 1) {
                                // import { one as two } from 'module' -> var two = require('module').one;
                                const importNamed = getArray(state.importNamedFrom, module.value)[0];
                                imports.push(withLocation(requireNameTemplate({
                                    moduleStr: t.cloneNode(resolved),
                                    nameId: t.identifier(importNamed.name),
                                    asId: t.identifier(importNamed.as),
                                }), getArray(state.importNamedFrom, module.value)[0].loc));
                            }
                            else {
                                // import { one as two, three as four } from 'module'
                                //   -> var _module = require('module'), two = _module.one, four = _module.four;
                                let sharedModuleImport = null;
                                for (const { name, as, loc } of getArray(state.importNamedFrom, module.value)) {
                                    if (!sharedModuleVariableDeclaration) {
                                        sharedModuleImport = path.scope.generateUidIdentifierBasedOnNode(module);
                                        sharedModuleVariableDeclaration = withLocation(t.variableDeclaration('var', [
                                            t.variableDeclarator(t.cloneNode(sharedModuleImport), t.callExpression(t.identifier('require'), [t.cloneNode(resolved)])),
                                        ]), loc);
                                        imports.push(sharedModuleVariableDeclaration);
                                    }
                                    sharedModuleVariableDeclaration.declarations.push(withLocation(t.variableDeclarator(t.identifier(as), t.memberExpression(t.cloneNode(nullthrows(sharedModuleImport)), t.identifier(name))), loc));
                                }
                            }
                            if (!sharedModuleVariableDeclaration && state.importSideEffect.has(module.value)) {
                                // import 'module' -> require('module')
                                imports.push(withLocation(requireSideEffectTemplate({
                                    moduleStr: t.cloneNode(resolved),
                                }), state.importSideEffect.get(module.value)?.loc));
                            }
                            for (const { as, loc } of getArray(state.importAllFromAs, module.value)) {
                                // import * as name from 'module'
                                imports.push(withLocation(importTemplate({
                                    importHelperId: t.cloneNode(state.importAll),
                                    moduleStr: t.cloneNode(resolved),
                                    asId: t.identifier(as),
                                }), loc));
                            }
                            for (const { as, loc } of getArray(state.importDefaultFromAs, module.value)) {
                                // import name from 'module'
                                imports.push(withLocation(importTemplate({
                                    importHelperId: t.cloneNode(state.importDefault),
                                    moduleStr: t.cloneNode(resolved),
                                    asId: as,
                                }), loc));
                            }
                        }
                        for (const { name, as, loc } of state.exportNamed) {
                            staticExports.push(withLocation(staticExportTemplate({
                                nameId: t.identifier(name),
                                asId: t.identifier(as),
                            }), loc));
                        }
                        for (const { name, loc } of state.exportDefault) {
                            defaultStaticExports.push(withLocation(staticExportTemplate({
                                nameId: t.identifier(name),
                                asId: t.identifier('default'),
                            }), loc));
                        }
                        body.unshift(...imports);
                        body.push(...exportAll);
                        body.push(...staticExports);
                        body.push(...defaultStaticExports);
                    }
                    if (hasEsmExports) {
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