"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidRequireCallError = exports.getExportNamesFromPath = void 0;
/**
 * Copyright 2024-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const generator_1 = __importDefault(require("@babel/generator"));
const template_1 = __importDefault(require("@babel/template"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const types_1 = require("@babel/types");
const t = __importStar(require("@babel/types"));
const node_assert_1 = __importDefault(require("node:assert"));
const crypto = __importStar(require("node:crypto"));
const debug = require('debug')('expo:metro:collect-dependencies');
const MAGIC_IMPORT_COMMENT = '@metro-ignore';
// asserts non-null
function nullthrows(x, message) {
    (0, node_assert_1.default)(x != null, message);
    return x;
}
function collectDependencies(ast, options) {
    const visited = new WeakSet();
    const state = {
        asyncRequireModulePathStringLiteral: null,
        dependencyCalls: new Set(),
        dependencyRegistry: new DependencyRegistry(),
        dependencyTransformer: options.dependencyTransformer ?? DefaultDependencyTransformer,
        dependencyMapIdentifier: null,
        dynamicRequires: options.dynamicRequires,
        keepRequireNames: options.keepRequireNames,
        allowOptionalDependencies: options.allowOptionalDependencies,
        unstable_allowRequireContext: options.unstable_allowRequireContext,
        collectOnly: options.collectOnly,
    };
    (0, traverse_1.default)(ast, {
        CallExpression(path, state) {
            if (visited.has(path.node)) {
                return;
            }
            const callee = path.node.callee;
            const name = callee.type === 'Identifier' ? callee.name : null;
            if ((0, types_1.isImport)(callee)) {
                processImportCall(path, state, {
                    dynamicRequires: options.dynamicRequires,
                    asyncType: 'async',
                });
                return;
            }
            if (name === '__prefetchImport' && !path.scope.getBinding(name)) {
                processImportCall(path, state, {
                    dynamicRequires: options.dynamicRequires,
                    asyncType: 'prefetch',
                });
                return;
            }
            if (state.unstable_allowRequireContext &&
                callee.type === 'MemberExpression' &&
                callee.object.type === 'Identifier' &&
                callee.object.name === 'require' &&
                callee.property.type === 'Identifier' &&
                callee.property.name === 'context' &&
                !callee.computed &&
                !path.scope.getBinding('require')) {
                processRequireContextCall(path, state);
                visited.add(path.node);
                return;
            }
            if (callee.type === 'MemberExpression' &&
                callee.object.type === 'Identifier' &&
                callee.object.name === 'require' &&
                callee.property.type === 'Identifier' &&
                callee.property.name === 'resolveWeak' &&
                !callee.computed &&
                !path.scope.getBinding('require')) {
                processResolveWeakCall(path, state);
                visited.add(path.node);
                return;
            }
            // Match `require.unstable_importMaybeSync`
            if (callee.type === 'MemberExpression' &&
                // `require`
                callee.object.type === 'Identifier' &&
                callee.object.name === 'require' &&
                // `unstable_importMaybeSync`
                callee.property.type === 'Identifier' &&
                callee.property.name === 'unstable_importMaybeSync' &&
                !callee.computed &&
                // Ensure `require` refers to the global and not something else.
                !path.scope.getBinding('require')) {
                processImportCall(path, state, {
                    dynamicRequires: options.dynamicRequires,
                    asyncType: 'maybeSync',
                });
                visited.add(path.node);
                return;
            }
            if (name != null && state.dependencyCalls.has(name) && !path.scope.getBinding(name)) {
                processRequireCall(path, state);
                visited.add(path.node);
            }
        },
        ImportDeclaration: collectImports,
        ExportNamedDeclaration: collectImports,
        ExportAllDeclaration: collectImports,
        Program(path, state) {
            state.asyncRequireModulePathStringLiteral = t.stringLiteral(options.asyncRequireModulePath);
            if (options.dependencyMapName != null) {
                state.dependencyMapIdentifier = t.identifier(options.dependencyMapName);
            }
            else {
                state.dependencyMapIdentifier = path.scope.generateUidIdentifier('dependencyMap');
            }
            state.dependencyCalls = new Set(['require', ...options.inlineableCalls]);
        },
    }, undefined, state);
    const collectedDependencies = state.dependencyRegistry.getDependencies();
    const dependencies = new Array(collectedDependencies.length);
    for (const { index, name, ...dependencyData } of collectedDependencies) {
        dependencies[index] = {
            name,
            data: dependencyData,
        };
    }
    return {
        ast,
        dependencies,
        dependencyMapName: nullthrows(state.dependencyMapIdentifier).name,
    };
}
function getRequireContextArgs(path) {
    const args = path.get('arguments');
    let directory;
    if (!Array.isArray(args) || args.length < 1) {
        throw new InvalidRequireCallError(path);
    }
    else {
        const result = args[0].evaluate();
        if (result.confident && typeof result.value === 'string') {
            directory = result.value;
        }
        else {
            throw new InvalidRequireCallError(result.deopt ?? args[0], 'First argument of `require.context` should be a string denoting the directory to require.');
        }
    }
    let recursive = true;
    if (args.length > 1) {
        const result = args[1].evaluate();
        if (result.confident && typeof result.value === 'boolean') {
            recursive = result.value;
        }
        else if (!(result.confident && typeof result.value === 'undefined')) {
            throw new InvalidRequireCallError(result.deopt ?? args[1], 'Second argument of `require.context` should be an optional boolean indicating if files should be imported recursively or not.');
        }
    }
    let filter = { pattern: '.*', flags: '' };
    if (args.length > 2) {
        const result = args[2].evaluate();
        const argNode = args[2].node;
        if (argNode.type === 'RegExpLiteral') {
            filter = {
                pattern: argNode.pattern,
                flags: argNode.flags || '',
            };
        }
        else if (!(result.confident && typeof result.value === 'undefined')) {
            throw new InvalidRequireCallError(args[2], `Third argument of \`require.context\` should be an optional RegExp pattern matching all of the files to import, instead found node of type: ${argNode.type}.`);
        }
    }
    let mode = 'sync';
    if (args.length > 3) {
        const result = args[3].evaluate();
        if (result.confident && typeof result.value === 'string') {
            mode = getContextMode(args[3], result.value);
        }
        else if (!(result.confident && typeof result.value === 'undefined')) {
            throw new InvalidRequireCallError(result.deopt ?? args[3], 'Fourth argument of `require.context` should be an optional string "mode" denoting how the modules will be resolved.');
        }
    }
    if (args.length > 4) {
        throw new InvalidRequireCallError(path, `Too many arguments provided to \`require.context\` call. Expected 4, got: ${args.length}`);
    }
    return [
        directory,
        {
            recursive,
            filter,
            mode,
        },
    ];
}
function getContextMode(path, mode) {
    if (mode === 'sync' || mode === 'eager' || mode === 'lazy' || mode === 'lazy-once') {
        return mode;
    }
    throw new InvalidRequireCallError(path, `require.context "${mode}" mode is not supported. Expected one of: sync, eager, lazy, lazy-once`);
}
function processRequireContextCall(path, state) {
    const [directory, contextParams] = getRequireContextArgs(path);
    const transformer = state.dependencyTransformer;
    const dep = registerDependency(state, {
        name: directory,
        contextParams,
        asyncType: null,
        optional: isOptionalDependency(directory, path, state),
        exportNames: ['*'],
    }, path);
    // If the pass is only collecting dependencies then we should avoid mutating the AST,
    // this enables calling collectDependencies multiple times on the same AST.
    if (state.collectOnly !== true) {
        // require() the generated module representing this context
        path.get('callee').replaceWith(t.identifier('require'));
    }
    transformer.transformSyncRequire(path, dep, state);
}
function processResolveWeakCall(path, state) {
    const name = getModuleNameFromCallArgs(path);
    if (name == null) {
        throw new InvalidRequireCallError(path);
    }
    const dependency = registerDependency(state, {
        name,
        asyncType: 'weak',
        optional: isOptionalDependency(name, path, state),
        exportNames: ['*'],
    }, path);
    path.replaceWith(makeResolveWeakTemplate({
        MODULE_ID: createModuleIDExpression(dependency, state),
    }));
}
function getExportNamesFromPath(path) {
    if (path.node.source) {
        if (t.isExportAllDeclaration(path.node)) {
            return ['*'];
        }
        else if (t.isExportNamedDeclaration(path.node)) {
            return path.node.specifiers.map((specifier) => {
                const exportedName = t.isIdentifier(specifier.exported)
                    ? specifier.exported.name
                    : specifier.exported.value;
                const localName = 'local' in specifier ? specifier.local.name : exportedName;
                // `export { default as add } from './add'`
                return specifier.type === 'ExportSpecifier' ? localName : exportedName;
            });
        }
        else if (t.isImportDeclaration(path.node)) {
            return path.node.specifiers
                .map((specifier) => {
                if (specifier.type === 'ImportDefaultSpecifier') {
                    return 'default';
                }
                else if (specifier.type === 'ImportNamespaceSpecifier') {
                    return '*';
                }
                return t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported)
                    ? specifier.imported.name
                    : null;
            })
                .filter(Boolean);
        }
    }
    return [];
}
exports.getExportNamesFromPath = getExportNamesFromPath;
function collectImports(path, state) {
    if (path.node.source) {
        registerDependency(state, {
            name: path.node.source.value,
            asyncType: null,
            optional: false,
            exportNames: getExportNamesFromPath(path),
        }, path);
    }
}
/**
 * @returns `true` if the import contains the magic comment for opting-out of bundling.
 */
function hasMagicImportComment(path) {
    // Get first argument of import()
    const [firstArg] = path.node.arguments;
    // Check comments before the argument
    return !!(firstArg?.leadingComments?.some((comment) => comment.value.includes(MAGIC_IMPORT_COMMENT)) ||
        path.node.leadingComments?.some((comment) => comment.value.includes(MAGIC_IMPORT_COMMENT)) ||
        // Get the inner comments between import and its argument
        path.node.innerComments?.some((comment) => comment.value.includes(MAGIC_IMPORT_COMMENT)));
}
function processImportCall(path, state, options) {
    // Check both leading and inner comments
    if (hasMagicImportComment(path)) {
        const line = path.node.loc && path.node.loc.start && path.node.loc.start.line;
        debug(`Magic comment at line ${line || '<unknown>'}: Ignoring import: ${(0, generator_1.default)(path.node).code}`);
        return;
    }
    const name = getModuleNameFromCallArgs(path);
    if (name == null) {
        if (options.dynamicRequires === 'warn') {
            warnDynamicRequire(path);
            return;
        }
        throw new InvalidRequireCallError(path);
    }
    const dep = registerDependency(state, {
        name,
        asyncType: options.asyncType,
        optional: isOptionalDependency(name, path, state),
        exportNames: ['*'],
    }, path);
    const transformer = state.dependencyTransformer;
    switch (options.asyncType) {
        case 'async':
            transformer.transformImportCall(path, dep, state);
            break;
        case 'maybeSync':
            transformer.transformImportMaybeSyncCall(path, dep, state);
            break;
        case 'prefetch':
            transformer.transformPrefetch(path, dep, state);
            break;
        default:
            throw new Error('Unreachable');
    }
}
function warnDynamicRequire({ node }, message = '') {
    const line = node.loc && node.loc.start && node.loc.start.line;
    console.warn(`Dynamic import at line ${line || '<unknown>'}: ${(0, generator_1.default)(node).code}. This module may not work as intended when deployed to a runtime. ${message}`.trim());
}
function processRequireCall(path, state) {
    const name = getModuleNameFromCallArgs(path);
    const transformer = state.dependencyTransformer;
    if (name == null) {
        if (state.dynamicRequires === 'reject') {
            throw new InvalidRequireCallError(path);
        }
        else if (state.dynamicRequires === 'warn') {
            warnDynamicRequire(path);
            return;
        }
        else {
            transformer.transformIllegalDynamicRequire(path, state);
        }
        return;
    }
    const dep = registerDependency(state, {
        name,
        asyncType: null,
        optional: isOptionalDependency(name, path, state),
        exportNames: ['*'],
    }, path);
    transformer.transformSyncRequire(path, dep, state);
}
function getNearestLocFromPath(path) {
    let current = path;
    while (current && !current.node.loc && !current.node.METRO_INLINE_REQUIRES_INIT_LOC) {
        current = current.parentPath;
    }
    return current?.node.METRO_INLINE_REQUIRES_INIT_LOC ?? current?.node.loc;
}
function registerDependency(state, qualifier, path) {
    const dependency = state.dependencyRegistry.registerDependency(qualifier);
    const loc = getNearestLocFromPath(path);
    if (loc != null) {
        dependency.locs.push(loc);
    }
    return dependency;
}
function isOptionalDependency(name, path, state) {
    const { allowOptionalDependencies } = state;
    if (name === state.asyncRequireModulePathStringLiteral?.value) {
        return false;
    }
    const isExcluded = () => typeof allowOptionalDependencies !== 'boolean' &&
        Array.isArray(allowOptionalDependencies.exclude) &&
        allowOptionalDependencies.exclude.includes(name);
    if (!allowOptionalDependencies || isExcluded()) {
        return false;
    }
    let sCount = 0;
    let p = path;
    while (p && sCount < 3) {
        if (p.isStatement()) {
            if (p.node.type === 'BlockStatement') {
                return (p.parentPath != null && p.parentPath.node.type === 'TryStatement' && p.key === 'block');
            }
            sCount += 1;
        }
        p = p.parentPath;
    }
    return false;
}
function getModuleNameFromCallArgs(path) {
    const args = path.get('arguments');
    if (!Array.isArray(args) || args.length !== 1) {
        throw new InvalidRequireCallError(path);
    }
    const result = args[0].evaluate();
    if (result.confident && typeof result.value === 'string') {
        return result.value;
    }
    return null;
}
const dynamicRequireErrorTemplate = template_1.default.expression(`
  (function(line) {
    throw new Error(
      'Dynamic require defined at line ' + line + '; not supported by Metro',
    );
  })(LINE)
`);
const makeAsyncRequireTemplate = template_1.default.expression(`
  require(ASYNC_REQUIRE_MODULE_PATH)(MODULE_ID, DEPENDENCY_MAP.paths)
`);
const makeAsyncRequireTemplateWithName = template_1.default.expression(`
  require(ASYNC_REQUIRE_MODULE_PATH)(MODULE_ID, DEPENDENCY_MAP.paths, MODULE_NAME)
`);
const makeAsyncPrefetchTemplate = template_1.default.expression(`
  require(ASYNC_REQUIRE_MODULE_PATH).prefetch(MODULE_ID, DEPENDENCY_MAP.paths)
`);
const makeAsyncPrefetchTemplateWithName = template_1.default.expression(`
  require(ASYNC_REQUIRE_MODULE_PATH).prefetch(MODULE_ID, DEPENDENCY_MAP.paths, MODULE_NAME)
`);
const makeAsyncImportMaybeSyncTemplate = template_1.default.expression(`
  require(ASYNC_REQUIRE_MODULE_PATH).unstable_importMaybeSync(MODULE_ID, DEPENDENCY_MAP.paths)
`);
const makeAsyncImportMaybeSyncTemplateWithName = template_1.default.expression(`
  require(ASYNC_REQUIRE_MODULE_PATH).unstable_importMaybeSync(MODULE_ID, DEPENDENCY_MAP.paths, MODULE_NAME)
`);
const makeResolveWeakTemplate = template_1.default.expression(`
  MODULE_ID
`);
const DefaultDependencyTransformer = {
    transformSyncRequire(path, dependency, state) {
        const moduleIDExpression = createModuleIDExpression(dependency, state);
        path.node.arguments = [moduleIDExpression];
        if (state.keepRequireNames) {
            path.node.arguments.push(t.stringLiteral(dependency.name));
        }
    },
    transformImportCall(path, dependency, state) {
        const makeNode = state.keepRequireNames
            ? makeAsyncRequireTemplateWithName
            : makeAsyncRequireTemplate;
        const opts = {
            ASYNC_REQUIRE_MODULE_PATH: nullthrows(state.asyncRequireModulePathStringLiteral),
            MODULE_ID: createModuleIDExpression(dependency, state),
            DEPENDENCY_MAP: nullthrows(state.dependencyMapIdentifier),
            ...(state.keepRequireNames ? { MODULE_NAME: createModuleNameLiteral(dependency) } : null),
        };
        path.replaceWith(makeNode(opts));
    },
    transformImportMaybeSyncCall(path, dependency, state) {
        const makeNode = state.keepRequireNames
            ? makeAsyncImportMaybeSyncTemplateWithName
            : makeAsyncImportMaybeSyncTemplate;
        const opts = {
            ASYNC_REQUIRE_MODULE_PATH: nullthrows(state.asyncRequireModulePathStringLiteral),
            MODULE_ID: createModuleIDExpression(dependency, state),
            DEPENDENCY_MAP: nullthrows(state.dependencyMapIdentifier),
            ...(state.keepRequireNames ? { MODULE_NAME: createModuleNameLiteral(dependency) } : null),
        };
        path.replaceWith(makeNode(opts));
    },
    transformPrefetch(path, dependency, state) {
        const makeNode = state.keepRequireNames
            ? makeAsyncPrefetchTemplateWithName
            : makeAsyncPrefetchTemplate;
        const opts = {
            ASYNC_REQUIRE_MODULE_PATH: nullthrows(state.asyncRequireModulePathStringLiteral),
            MODULE_ID: createModuleIDExpression(dependency, state),
            DEPENDENCY_MAP: nullthrows(state.dependencyMapIdentifier),
            ...(state.keepRequireNames ? { MODULE_NAME: createModuleNameLiteral(dependency) } : null),
        };
        path.replaceWith(makeNode(opts));
    },
    transformIllegalDynamicRequire(path, state) {
        path.replaceWith(dynamicRequireErrorTemplate({
            LINE: t.numericLiteral(path.node.loc?.start.line ?? 0),
        }));
    },
};
function createModuleIDExpression(dependency, state) {
    return t.memberExpression(nullthrows(state.dependencyMapIdentifier), t.numericLiteral(dependency.index), true);
}
function createModuleNameLiteral(dependency) {
    return t.stringLiteral(dependency.name);
}
function getKeyForDependency(qualifier) {
    let key = qualifier.name;
    const { asyncType } = qualifier;
    if (asyncType) {
        key += ['', asyncType].join('\0');
    }
    const { contextParams } = qualifier;
    if (contextParams) {
        key += [
            '',
            'context',
            String(contextParams.recursive),
            String(contextParams.filter.pattern),
            String(contextParams.filter.flags),
            contextParams.mode,
        ].join('\0');
    }
    return key;
}
class DependencyRegistry {
    _dependencies = new Map();
    registerDependency(qualifier) {
        const key = getKeyForDependency(qualifier);
        let dependency = this._dependencies.get(key) ?? null;
        if (dependency == null) {
            const newDependency = {
                name: qualifier.name,
                asyncType: qualifier.asyncType,
                exportNames: qualifier.exportNames,
                locs: [],
                index: this._dependencies.size,
                key: crypto.createHash('sha1').update(key).digest('base64'),
            };
            if (qualifier.optional) {
                newDependency.isOptional = true;
            }
            if (qualifier.contextParams) {
                newDependency.contextParams = qualifier.contextParams;
            }
            dependency = newDependency;
        }
        else {
            if (dependency.isOptional && !qualifier.optional) {
                dependency = {
                    ...dependency,
                    isOptional: false,
                };
            }
            dependency = {
                ...dependency,
                exportNames: [...new Set(dependency.exportNames.concat(qualifier.exportNames))],
            };
        }
        this._dependencies.set(key, dependency);
        return dependency;
    }
    getDependencies() {
        return Array.from(this._dependencies.values());
    }
}
class InvalidRequireCallError extends Error {
    constructor({ node }, message) {
        const line = node.loc && node.loc.start && node.loc.start.line;
        super([`Invalid call at line ${line || '<unknown>'}: ${(0, generator_1.default)(node).code}`, message]
            .filter(Boolean)
            .join('\n'));
    }
}
exports.InvalidRequireCallError = InvalidRequireCallError;
exports.default = collectDependencies;
//# sourceMappingURL=collect-dependencies.js.map