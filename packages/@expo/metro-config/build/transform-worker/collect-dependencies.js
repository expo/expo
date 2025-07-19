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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidRequireCallError = void 0;
exports.getExportNamesFromPath = getExportNamesFromPath;
exports.getKeyForDependency = getKeyForDependency;
exports.hashKey = hashKey;
/**
 * Copyright 2024-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const core_1 = require("@babel/core");
const generator_1 = __importDefault(require("@babel/generator"));
const node_assert_1 = __importDefault(require("node:assert"));
const crypto = __importStar(require("node:crypto"));
const debug = require('debug')('expo:metro:collect-dependencies');
const MAGIC_IMPORT_COMMENTS = [
    '@metro-ignore',
    // Add support for Webpack ignore comment which is used in many different React libraries.
    'webpackIgnore: true',
];
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
        unstable_isESMImportAtSource: options.unstable_isESMImportAtSource ?? null,
        collectOnly: options.collectOnly,
    };
    (0, core_1.traverse)(ast, {
        // Match new Worker() patterns
        NewExpression(path, state) {
            if (path.node.callee.type === 'Identifier' &&
                (path.node.callee.name === 'Worker' || path.node.callee.name === 'SharedWorker')) {
                const [firstArg] = path.node.arguments;
                // Match: new Worker(new URL("../path/to/module", import.meta.url))
                if (firstArg &&
                    firstArg.type === 'NewExpression' &&
                    firstArg.callee.type === 'Identifier' &&
                    firstArg.callee.name === 'URL' &&
                    firstArg.arguments.length > 0 &&
                    firstArg.arguments[0].type === 'StringLiteral') {
                    const moduleName = firstArg.arguments[0].value;
                    // Get the NodePath of the first argument of `new Worker(new URL())`
                    const urlArgPath = path.get('arguments')[0].get('arguments')[0];
                    processResolveWorkerCallWithName(moduleName, urlArgPath, state);
                }
            }
        },
        CallExpression(path, state) {
            if (visited.has(path.node)) {
                return;
            }
            const callee = path.node.callee;
            const name = callee.type === 'Identifier' ? callee.name : null;
            if (core_1.types.isImport(callee)) {
                processImportCall(path, state, {
                    asyncType: 'async',
                    isESMImport: true,
                    dynamicRequires: options.dynamicRequires,
                });
                return;
            }
            if (name === '__prefetchImport' && !path.scope.getBinding(name)) {
                processImportCall(path, state, {
                    asyncType: 'prefetch',
                    isESMImport: true,
                    dynamicRequires: options.dynamicRequires,
                });
                return;
            }
            // Match `require.context`
            if (
            // Feature gate, defaults to `false`.
            state.unstable_allowRequireContext &&
                callee.type === 'MemberExpression' &&
                // `require`
                callee.object.type === 'Identifier' &&
                callee.object.name === 'require' &&
                // `context`
                callee.property.type === 'Identifier' &&
                callee.property.name === 'context' &&
                !callee.computed &&
                // Ensure `require` refers to the global and not something else.
                !path.scope.getBinding('require')) {
                processRequireContextCall(path, state);
                visited.add(path.node);
                return;
            }
            // Match `require.resolveWeak`
            if (callee.type === 'MemberExpression' &&
                // `require`
                callee.object.type === 'Identifier' &&
                callee.object.name === 'require' &&
                // `resolveWeak`
                callee.property.type === 'Identifier' &&
                callee.property.name === 'resolveWeak' &&
                !callee.computed &&
                // Ensure `require` refers to the global and not something else.
                !path.scope.getBinding('require')) {
                processResolveWeakCall(path, state);
                visited.add(path.node);
                return;
            }
            // Match `require.unstable_resolveWorker`
            if (callee.type === 'MemberExpression' &&
                callee.object.type === 'Identifier' &&
                callee.object.name === 'require' &&
                callee.property.type === 'Identifier' &&
                callee.property.name === 'unstable_resolveWorker' &&
                !callee.computed &&
                !path.scope.getBinding('require')) {
                processResolveWorkerCall(path, state);
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
                    asyncType: 'maybeSync',
                    // Treat require.unstable_importMaybeSync as an ESM import, like its
                    // async "await import()" counterpart. Subject to change while
                    // unstable_.
                    isESMImport: true,
                    dynamicRequires: options.dynamicRequires,
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
            state.asyncRequireModulePathStringLiteral = core_1.types.stringLiteral(options.asyncRequireModulePath);
            if (options.dependencyMapName != null) {
                state.dependencyMapIdentifier = core_1.types.identifier(options.dependencyMapName);
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
/** Extract args passed to the `require.context` method. */
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
    // Default to requiring through all directories.
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
    // Default to all files.
    let filter = { pattern: '.*', flags: '' };
    if (args.length > 2) {
        // evaluate() to check for undefined (because it's technically a scope lookup)
        // but check the AST for the regex literal, since evaluate() doesn't do regex.
        const result = args[2].evaluate();
        const argNode = args[2].node;
        if (argNode.type === 'RegExpLiteral') {
            // TODO: Handle `new RegExp(...)` -- `argNode.type === 'NewExpression'`
            filter = {
                pattern: argNode.pattern,
                flags: argNode.flags || '',
            };
        }
        else if (!(result.confident && typeof result.value === 'undefined')) {
            throw new InvalidRequireCallError(args[2], `Third argument of \`require.context\` should be an optional RegExp pattern matching all of the files to import, instead found node of type: ${argNode.type}.`);
        }
    }
    // Default to `sync`.
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
        // We basically want to "import" every file in a folder and then filter them out with the given `filter` RegExp.
        name: directory,
        // Capture the matching context
        contextParams,
        asyncType: null,
        isESMImport: false,
        optional: isOptionalDependency(directory, path, state),
        exportNames: ['*'],
    }, path);
    // If the pass is only collecting dependencies then we should avoid mutating the AST,
    // this enables calling collectDependencies multiple times on the same AST.
    if (state.collectOnly !== true) {
        // require() the generated module representing this context
        path.get('callee').replaceWith(core_1.types.identifier('require'));
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
        isESMImport: false,
        optional: isOptionalDependency(name, path, state),
        exportNames: ['*'],
    }, path);
    if (state.collectOnly !== true) {
        path.replaceWith(makeResolveWeakTemplate({
            MODULE_ID: createModuleIDExpression(dependency, state),
        }));
    }
}
function processResolveWorkerCall(path, state) {
    const name = getModuleNameFromCallArgs(path);
    if (name == null) {
        throw new InvalidRequireCallError(path);
    }
    return processResolveWorkerCallWithName(name, path, state);
}
function processResolveWorkerCallWithName(name, path, state) {
    const dependency = registerDependency(state, {
        name,
        asyncType: 'worker',
        isESMImport: false,
        optional: isOptionalDependency(name, path, state),
        exportNames: ['*'],
    }, path);
    if (state.collectOnly !== true) {
        path.replaceWith(makeResolveTemplate({
            ASYNC_REQUIRE_MODULE_PATH: nullthrows(state.asyncRequireModulePathStringLiteral),
            DEPENDENCY_MAP: nullthrows(state.dependencyMapIdentifier),
            MODULE_ID: createModuleIDExpression(dependency, state),
        }));
    }
    else {
        // Inject the async require dependency into the dependency map so it's available in the graph during serialization and splitting.
        registerDependency(state, {
            name: nullthrows(state.asyncRequireModulePathStringLiteral).value,
            asyncType: null,
            isESMImport: false,
            optional: false,
            exportNames: ['*'],
        }, path);
    }
}
function getExportNamesFromPath(path) {
    if (path.node.source) {
        if (core_1.types.isExportAllDeclaration(path.node)) {
            return ['*'];
        }
        else if (core_1.types.isExportNamedDeclaration(path.node)) {
            return path.node.specifiers.map((specifier) => {
                const exportedName = core_1.types.isIdentifier(specifier.exported)
                    ? specifier.exported.name
                    : specifier.exported.value;
                const localName = 'local' in specifier ? specifier.local.name : exportedName;
                // `export { default as add } from './add'`
                return specifier.type === 'ExportSpecifier' ? localName : exportedName;
            });
        }
        else if (core_1.types.isImportDeclaration(path.node)) {
            return path.node.specifiers
                .map((specifier) => {
                if (specifier.type === 'ImportDefaultSpecifier') {
                    return 'default';
                }
                else if (specifier.type === 'ImportNamespaceSpecifier') {
                    return '*';
                }
                return core_1.types.isImportSpecifier(specifier) && core_1.types.isIdentifier(specifier.imported)
                    ? specifier.imported.name
                    : null;
            })
                .filter(Boolean);
        }
    }
    return [];
}
function collectImports(path, state) {
    if (path.node.source) {
        registerDependency(state, {
            name: path.node.source.value,
            asyncType: null,
            isESMImport: true,
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
    return !!MAGIC_IMPORT_COMMENTS.some((magicComment) => firstArg?.leadingComments?.some((comment) => comment.value.includes(magicComment)) ||
        path.node.leadingComments?.some((comment) => comment.value.includes(magicComment)) ||
        // Get the inner comments between import and its argument
        path.node.innerComments?.some((comment) => comment.value.includes(magicComment)));
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
        isESMImport: options.isESMImport,
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
    let isESMImport = false;
    if (state.unstable_isESMImportAtSource) {
        const isImport = state.unstable_isESMImportAtSource;
        const loc = getNearestLocFromPath(path);
        if (loc) {
            isESMImport = isImport(loc);
        }
    }
    const dep = registerDependency(state, {
        name,
        asyncType: null,
        isESMImport,
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
    // Avoid using the location of the `Program` node,
    // to avoid conflating locations of single line code
    if (current && core_1.types.isProgram(current.node)) {
        current = null;
    }
    return current?.node.METRO_INLINE_REQUIRES_INIT_LOC ?? current?.node.loc;
}
function registerDependency(state, qualifier, path) {
    const dependency = state.dependencyRegistry.registerDependency(qualifier);
    const loc = getNearestLocFromPath(path);
    if (loc != null) {
        dependency.locs.push(loc);
    }
    dependency.imports += 1;
    return dependency;
}
function isOptionalDependency(name, path, state) {
    const { allowOptionalDependencies } = state;
    // The async require module is a 'built-in'. Resolving should never fail -> treat it as non-optional.
    if (name === state.asyncRequireModulePathStringLiteral?.value) {
        return false;
    }
    const isExcluded = () => typeof allowOptionalDependencies !== 'boolean' &&
        Array.isArray(allowOptionalDependencies.exclude) &&
        allowOptionalDependencies.exclude.includes(name);
    if (!allowOptionalDependencies || isExcluded()) {
        return false;
    }
    // Valid statement stack for single-level try-block: expressionStatement -> blockStatement -> tryStatement
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
class InvalidRequireCallError extends Error {
    constructor({ node }, message) {
        const line = node.loc && node.loc.start && node.loc.start.line;
        super([`Invalid call at line ${line || '<unknown>'}: ${(0, generator_1.default)(node).code}`, message]
            .filter(Boolean)
            .join('\n'));
    }
}
exports.InvalidRequireCallError = InvalidRequireCallError;
/**
 * Produces a Babel template that will throw at runtime when the require call
 * is reached. This makes dynamic require errors catchable by libraries that
 * want to use them.
 */
const dynamicRequireErrorTemplate = core_1.template.expression(`
  (function(line) {
    throw new Error(
      'Dynamic require defined at line ' + line + '; not supported by Metro',
    );
  })(LINE)
`);
/**
 * Produces a Babel template that transforms an "import(...)" call into a
 * "require(...)" call to the asyncRequire specified.
 */
const makeAsyncRequireTemplate = core_1.template.expression(`
  require(ASYNC_REQUIRE_MODULE_PATH)(MODULE_ID, DEPENDENCY_MAP.paths)
`);
const makeAsyncRequireTemplateWithName = core_1.template.expression(`
  require(ASYNC_REQUIRE_MODULE_PATH)(MODULE_ID, DEPENDENCY_MAP.paths, MODULE_NAME)
`);
const makeAsyncPrefetchTemplate = core_1.template.expression(`
  require(ASYNC_REQUIRE_MODULE_PATH).prefetch(MODULE_ID, DEPENDENCY_MAP.paths)
`);
const makeAsyncPrefetchTemplateWithName = core_1.template.expression(`
  require(ASYNC_REQUIRE_MODULE_PATH).prefetch(MODULE_ID, DEPENDENCY_MAP.paths, MODULE_NAME)
`);
const makeAsyncImportMaybeSyncTemplate = core_1.template.expression(`
  require(ASYNC_REQUIRE_MODULE_PATH).unstable_importMaybeSync(MODULE_ID, DEPENDENCY_MAP.paths)
`);
const makeResolveTemplate = core_1.template.expression(`
  require(ASYNC_REQUIRE_MODULE_PATH).unstable_resolve(MODULE_ID, DEPENDENCY_MAP.paths)
`);
const makeAsyncImportMaybeSyncTemplateWithName = core_1.template.expression(`
  require(ASYNC_REQUIRE_MODULE_PATH).unstable_importMaybeSync(MODULE_ID, DEPENDENCY_MAP.paths, MODULE_NAME)
`);
const makeResolveWeakTemplate = core_1.template.expression(`
  MODULE_ID
`);
const DefaultDependencyTransformer = {
    transformSyncRequire(path, dependency, state) {
        const moduleIDExpression = createModuleIDExpression(dependency, state);
        path.node.arguments = [moduleIDExpression];
        // Always add the debug name argument last
        if (state.keepRequireNames || dependency.isOptional) {
            path.node.arguments.push(core_1.types.stringLiteral(dependency.name));
        }
    },
    transformImportCall(path, dependency, state) {
        const keepRequireNames = state.keepRequireNames || dependency.isOptional;
        const makeNode = keepRequireNames ? makeAsyncRequireTemplateWithName : makeAsyncRequireTemplate;
        const opts = {
            ASYNC_REQUIRE_MODULE_PATH: nullthrows(state.asyncRequireModulePathStringLiteral),
            MODULE_ID: createModuleIDExpression(dependency, state),
            DEPENDENCY_MAP: nullthrows(state.dependencyMapIdentifier),
            ...(keepRequireNames ? { MODULE_NAME: createModuleNameLiteral(dependency) } : null),
        };
        path.replaceWith(makeNode(opts));
    },
    transformImportMaybeSyncCall(path, dependency, state) {
        const keepRequireNames = state.keepRequireNames || dependency.isOptional;
        const makeNode = keepRequireNames
            ? makeAsyncImportMaybeSyncTemplateWithName
            : makeAsyncImportMaybeSyncTemplate;
        const opts = {
            ASYNC_REQUIRE_MODULE_PATH: nullthrows(state.asyncRequireModulePathStringLiteral),
            MODULE_ID: createModuleIDExpression(dependency, state),
            DEPENDENCY_MAP: nullthrows(state.dependencyMapIdentifier),
            ...(keepRequireNames ? { MODULE_NAME: createModuleNameLiteral(dependency) } : null),
        };
        path.replaceWith(makeNode(opts));
    },
    transformPrefetch(path, dependency, state) {
        const keepRequireNames = state.keepRequireNames || dependency.isOptional;
        const makeNode = keepRequireNames
            ? makeAsyncPrefetchTemplateWithName
            : makeAsyncPrefetchTemplate;
        const opts = {
            ASYNC_REQUIRE_MODULE_PATH: nullthrows(state.asyncRequireModulePathStringLiteral),
            MODULE_ID: createModuleIDExpression(dependency, state),
            DEPENDENCY_MAP: nullthrows(state.dependencyMapIdentifier),
            ...(keepRequireNames ? { MODULE_NAME: createModuleNameLiteral(dependency) } : null),
        };
        path.replaceWith(makeNode(opts));
    },
    transformIllegalDynamicRequire(path, state) {
        path.replaceWith(dynamicRequireErrorTemplate({
            LINE: core_1.types.numericLiteral(path.node.loc?.start.line ?? 0),
        }));
    },
};
function createModuleIDExpression(dependency, state) {
    return core_1.types.memberExpression(nullthrows(state.dependencyMapIdentifier), core_1.types.numericLiteral(dependency.index), true);
}
function createModuleNameLiteral(dependency) {
    return core_1.types.stringLiteral(dependency.name);
}
/**
 * Given an import qualifier, return a key used to register the dependency.
 * Attributes can be appended to distinguish various combinations that would
 * otherwise be considered the same dependency edge.
 *
 * For example, the following dependencies would collapse into a single edge
 * if they simply utilized the `name` property:
 *
 * ```
 * require('./foo');
 * import foo from './foo'
 * await import('./foo')
 * require.context('./foo');
 * require.context('./foo', true, /something/);
 * require.context('./foo', false, /something/);
 * require.context('./foo', false, /something/, 'lazy');
 * ```
 *
 * This method should be utilized by `registerDependency`.
 */
function getKeyForDependency(qualifier) {
    const { asyncType, contextParams, isESMImport, name } = qualifier;
    let key = [name, isESMImport ? 'import' : 'require'].join('\0');
    if (asyncType != null) {
        key += '\0' + asyncType;
    }
    // Add extra qualifiers when using `require.context` to prevent collisions.
    if (contextParams) {
        // NOTE(EvanBacon): Keep this synchronized with `RequireContextParams`, if any other properties are added
        // then this key algorithm should be updated to account for those properties.
        // Example: `./directory__true__/foobar/m__lazy`
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
function hashKey(key) {
    return crypto.createHash('sha1').update(key).digest('base64');
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
                isESMImport: qualifier.isESMImport,
                locs: [],
                index: this._dependencies.size,
                key: hashKey(key),
                exportNames: qualifier.exportNames,
                imports: 0,
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
exports.default = collectDependencies;
//# sourceMappingURL=collect-dependencies.js.map