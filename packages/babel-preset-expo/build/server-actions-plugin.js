"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 lubieowoce
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/lubieowoce/tangle/blob/5229666fb317d0da9363363fc46dc542ba51e4f7/packages/babel-rsc/src/babel-rsc-actions.ts#L1C1-L909C25
 */
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
exports.reactServerActionsPlugin = void 0;
const core_1 = require("@babel/core");
// @ts-expect-error: missing types
const helper_module_imports_1 = require("@babel/helper-module-imports");
const t = __importStar(require("@babel/types"));
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
const url_1 = __importDefault(require("url"));
const common_1 = require("./common");
const debug = require('debug')('expo:babel:server-actions');
const LAZY_WRAPPER_VALUE_KEY = 'value';
// React doesn't like non-enumerable properties on serialized objects (see `isSimpleObject`),
// so we have to use closure scope for the cache (instead of a non-enumerable `this._cache`)
const _buildLazyWrapperHelper = (0, core_1.template)(`(thunk) => {
  let cache;
  return {
    get ${LAZY_WRAPPER_VALUE_KEY}() {
      return cache || (cache = thunk());
    }
  }
}`);
const buildLazyWrapperHelper = () => {
    return _buildLazyWrapperHelper().expression;
};
function reactServerActionsPlugin(api) {
    const possibleProjectRoot = api.caller(common_1.getPossibleProjectRoot);
    let addReactImport;
    let wrapBoundArgs;
    let getActionModuleId;
    const extractInlineActionToTopLevel = (path, _state, { body, freeVariables, }) => {
        const actionModuleId = getActionModuleId();
        const moduleScope = path.scope.getProgramParent();
        const extractedIdentifier = moduleScope.generateUidIdentifier('$$INLINE_ACTION');
        let extractedFunctionParams = [...path.node.params];
        let extractedFunctionBody = body.body;
        if (freeVariables.length > 0) {
            // only add a closure object if we're not closing over anything.
            // const [x, y, z] = await _decryptActionBoundArgs(await $$CLOSURE.value);
            const closureParam = path.scope.generateUidIdentifier('$$CLOSURE');
            const freeVarsPat = t.arrayPattern(freeVariables.map((variable) => t.identifier(variable)));
            const closureExpr = t.memberExpression(closureParam, t.identifier(LAZY_WRAPPER_VALUE_KEY));
            extractedFunctionParams = [closureParam, ...path.node.params];
            extractedFunctionBody = [
                t.variableDeclaration('var', [
                    t.variableDeclarator(t.assignmentPattern(freeVarsPat, closureExpr)),
                ]),
                ...extractedFunctionBody,
            ];
        }
        const wrapInRegister = (expr, exportedName) => {
            const expoRegisterServerReferenceId = addReactImport();
            return t.callExpression(expoRegisterServerReferenceId, [
                expr,
                t.stringLiteral(actionModuleId),
                t.stringLiteral(exportedName),
            ]);
        };
        const isArrowFn = path.isArrowFunctionExpression();
        const extractedFunctionExpr = wrapInRegister(isArrowFn
            ? t.arrowFunctionExpression(extractedFunctionParams, t.blockStatement(extractedFunctionBody), true)
            : t.functionExpression(path.node.id, extractedFunctionParams, t.blockStatement(extractedFunctionBody), false, true), extractedIdentifier.name);
        // Create a top-level declaration for the extracted function.
        const bindingKind = 'var';
        const functionDeclaration = t.exportNamedDeclaration(t.variableDeclaration(bindingKind, [
            t.variableDeclarator(extractedIdentifier, extractedFunctionExpr),
        ]));
        // TODO: this is cacheable, no need to recompute
        const programBody = moduleScope.path.get('body');
        const lastImportPath = findLast(Array.isArray(programBody) ? programBody : [programBody], (stmt) => stmt.isImportDeclaration());
        const [inserted] = lastImportPath.insertAfter(functionDeclaration);
        moduleScope.registerBinding(bindingKind, inserted);
        inserted.addComment('leading', ' hoisted action: ' + (getFnPathName(path) ?? '<anonymous>'), true);
        return {
            extractedIdentifier,
            getReplacement: () => getInlineActionReplacement({
                id: extractedIdentifier,
                freeVariables,
            }),
        };
    };
    const getInlineActionReplacement = ({ id, freeVariables, }) => {
        if (freeVariables.length === 0) {
            return id;
        }
        const capturedVarsExpr = t.arrayExpression(freeVariables.map((variable) => t.identifier(variable)));
        const boundArgs = wrapBoundArgs(capturedVarsExpr);
        // _ACTION.bind(null, { get value() { return _encryptActionBoundArgs([x, y, z]) } })
        return t.callExpression(t.memberExpression(id, t.identifier('bind')), [
            t.nullLiteral(),
            boundArgs,
        ]);
    };
    return {
        name: 'expo-server-actions',
        pre(file) {
            const projectRoot = possibleProjectRoot || file.opts.root || '';
            if (!file.code.includes('use server')) {
                file.path.skip();
                return;
            }
            assertExpoMetadata(file.metadata);
            file.metadata.extractedActions = [];
            file.metadata.isModuleMarkedWithUseServerDirective = false;
            const addNamedImportOnce = createAddNamedImportOnce(t);
            addReactImport = () => {
                return addNamedImportOnce(file.path, 'registerServerReference', 'react-server-dom-webpack/server');
            };
            getActionModuleId = once(() => {
                // Create relative file path hash.
                return (0, node_url_1.pathToFileURL)((0, node_path_1.relative)(projectRoot, file.opts.filename)).href;
            });
            const defineBoundArgsWrapperHelper = once(() => {
                const id = this.file.path.scope.generateUidIdentifier('wrapBoundArgs');
                this.file.path.scope.push({
                    id,
                    kind: 'var',
                    init: buildLazyWrapperHelper(),
                });
                return id;
            });
            wrapBoundArgs = (expr) => {
                const wrapperFn = t.cloneNode(defineBoundArgsWrapperHelper());
                return t.callExpression(wrapperFn, [t.arrowFunctionExpression([], expr)]);
            };
        },
        visitor: {
            Program(path, state) {
                if (path.node.directives.some((d) => d.value.value === 'use server')) {
                    assertExpoMetadata(state.file.metadata);
                    state.file.metadata.isModuleMarkedWithUseServerDirective = true;
                    // remove the directive so that downstream consumers don't transform the module again.
                    path.node.directives = path.node.directives.filter((d) => d.value.value !== 'use server');
                }
            },
            // `() => {}`
            ArrowFunctionExpression(path, state) {
                const { body } = path.node;
                if (!t.isBlockStatement(body) || !hasUseServerDirective(path)) {
                    return;
                }
                assertIsAsyncFn(path);
                const freeVariables = getFreeVariables(path);
                const tlb = getTopLevelBinding(path);
                const { extractedIdentifier, getReplacement } = extractInlineActionToTopLevel(path, state, {
                    freeVariables,
                    body,
                });
                path.replaceWith(getReplacement());
                assertExpoMetadata(state.file.metadata);
                state.file.metadata.extractedActions.push({
                    localName: tlb?.identifier.name,
                    exportedName: extractedIdentifier.name,
                });
            },
            // `function foo() { ... }`
            FunctionDeclaration(path, state) {
                if (!hasUseServerDirective(path)) {
                    return;
                }
                assertIsAsyncFn(path);
                const fnId = path.node.id;
                if (!fnId) {
                    throw path.buildCodeFrameError('Internal error: expected FunctionDeclaration to have a name');
                }
                const freeVariables = getFreeVariables(path);
                const { extractedIdentifier, getReplacement } = extractInlineActionToTopLevel(path, state, {
                    freeVariables,
                    body: path.node.body,
                });
                const tlb = getTopLevelBinding(path);
                if (tlb) {
                    // we're at the top level, and we might be enclosed within a `export` decl.
                    // we have to keep the export in place, because it might be used elsewhere,
                    // so we can't just remove this node.
                    // replace the function decl with a (hopefully) equivalent var declaration
                    // `var [name] = $$INLINE_ACTION_{N}`
                    // TODO: this'll almost certainly break when using default exports,
                    // but tangle's build doesn't support those anyway
                    const bindingKind = 'var';
                    const [inserted] = path.replaceWith(t.variableDeclaration(bindingKind, [t.variableDeclarator(fnId, extractedIdentifier)]));
                    tlb.scope.registerBinding(bindingKind, inserted);
                }
                else {
                    // note: if we do this *after* adding the new declaration, the bindings get messed up
                    path.remove();
                    // add a declaration in the place where the function decl would be hoisted to.
                    // (this avoids issues with functions defined after `return`, see `test-cases/named-after-return.jsx`)
                    path.scope.push({
                        id: fnId,
                        init: getReplacement(),
                        kind: 'var',
                        unique: true,
                    });
                }
                assertExpoMetadata(state.file.metadata);
                state.file.metadata.extractedActions.push({
                    localName: tlb?.identifier.name,
                    exportedName: extractedIdentifier.name,
                });
            },
            // `const foo = function() { ... }`
            FunctionExpression(path, state) {
                if (!hasUseServerDirective(path)) {
                    return;
                }
                assertIsAsyncFn(path);
                const { body } = path.node;
                const freeVariables = getFreeVariables(path);
                // TODO: look for usages of the name (if present), that's technically possible
                // const fnId = path.node.id;
                const { extractedIdentifier, getReplacement } = extractInlineActionToTopLevel(path, state, {
                    freeVariables,
                    body,
                });
                const tlb = getTopLevelBinding(path);
                assertExpoMetadata(state.file.metadata);
                path.replaceWith(getReplacement());
                state.file.metadata.extractedActions.push({
                    localName: tlb?.identifier.name,
                    exportedName: extractedIdentifier.name,
                });
            },
            // Top-level "use server"
            ExportDefaultDeclaration(path, state) {
                assertExpoMetadata(state.file.metadata);
                if (!state.file.metadata.isModuleMarkedWithUseServerDirective) {
                    return;
                }
                // Convert `export default function foo() {}` to `function foo() {}; export { foo as default }`
                if (path.node.declaration) {
                    if (t.isFunctionDeclaration(path.node.declaration)) {
                        let { id } = path.node.declaration;
                        if (id == null) {
                            const moduleScope = path.scope.getProgramParent();
                            const extractedIdentifier = moduleScope.generateUidIdentifier('$$INLINE_ACTION');
                            id = extractedIdentifier;
                            // Transform `async function () {}` to `async function $$INLINE_ACTION() {}`
                            path.node.declaration.id = extractedIdentifier;
                        }
                        const exportedSpecifier = t.exportSpecifier(id, t.identifier('default'));
                        path.replaceWith(path.node.declaration);
                        path.insertAfter(t.exportNamedDeclaration(null, [exportedSpecifier]));
                    }
                    else {
                        // Convert anonymous function expressions to named function expressions and export them as default.
                        // export default foo = async () => {}
                        // vvv
                        // const foo = async () => {}
                        // (() => _registerServerReference(foo, "file:///unknown", "default"))();
                        // export { foo as default };
                        if (t.isAssignmentExpression(path.node.declaration) &&
                            t.isArrowFunctionExpression(path.node.declaration.right)) {
                            if (!t.isIdentifier(path.node.declaration.left)) {
                                throw path.buildCodeFrameError(`Expected an assignment to an identifier but found ${path.node.declaration.left.type}.`);
                            }
                            const { left, right } = path.node.declaration;
                            const id = left;
                            const exportedSpecifier = t.exportSpecifier(id, t.identifier('default'));
                            // Replace `export default foo = async () => {}` with `const foo = async () => {}`
                            path.replaceWith(t.variableDeclaration('var', [t.variableDeclarator(id, right)]));
                            // Insert `(() => _registerServerReference(foo, "file:///unknown", "default"))();`
                            path.insertAfter(t.exportNamedDeclaration(null, [exportedSpecifier]));
                        }
                        else if (t.isArrowFunctionExpression(path.node.declaration) &&
                            path.node.declaration) {
                            // export default async () => {}
                            // Give the function a name
                            // const $$INLINE_ACTION = async () => {}
                            const moduleScope = path.scope.getProgramParent();
                            const extractedIdentifier = moduleScope.generateUidIdentifier('$$INLINE_ACTION');
                            // @ts-expect-error: Transform `export default async () => {}` to `const $$INLINE_ACTION = async () => {}`
                            path.node.declaration = t.variableDeclaration('var', [
                                t.variableDeclarator(extractedIdentifier, path.node.declaration),
                            ]);
                            // Strip the `export default`
                            path.replaceWith(path.node.declaration);
                            // export { $$INLINE_ACTION as default }
                            const exportedSpecifier = t.exportSpecifier(extractedIdentifier, t.identifier('default'));
                            path.insertAfter(t.exportNamedDeclaration(null, [exportedSpecifier]));
                        }
                        else if (
                        // Match `export default foo;`
                        t.isIdentifier(path.node.declaration)) {
                            // Ensure the `path.node.declaration` is a function or a variable for a function.
                            const binding = path.scope.getBinding(path.node.declaration.name);
                            const isServerActionType = t.isFunctionDeclaration(binding?.path.node ?? path.node.declaration) ||
                                t.isArrowFunctionExpression(binding?.path.node ?? path.node.declaration) ||
                                // `const foo = async () => {}`
                                (t.isVariableDeclarator(binding?.path.node) &&
                                    t.isArrowFunctionExpression(binding?.path.node.init));
                            if (isServerActionType) {
                                // Convert `export default foo;` to `export { foo as default };`
                                const exportedSpecifier = t.exportSpecifier(path.node.declaration, t.identifier('default'));
                                path.replaceWith(t.exportNamedDeclaration(null, [exportedSpecifier]));
                            }
                        }
                        else {
                            // Unclear when this happens.
                            throw path.buildCodeFrameError(`Cannot create server action. Expected a assignment expression but found ${path.node.declaration.type}.`);
                        }
                    }
                }
                else {
                    // TODO: Unclear when this happens.
                    throw path.buildCodeFrameError(`Not implemented: 'export default' declarations in "use server" files. Try using 'export { name as default }' instead.`);
                }
            },
            ExportNamedDeclaration(path, state) {
                assertExpoMetadata(state.file.metadata);
                if (!state.file.metadata.isModuleMarkedWithUseServerDirective) {
                    return;
                }
                // This can happen with `export {};` and TypeScript types.
                if (!path.node.declaration && !path.node.specifiers.length) {
                    return;
                }
                const registerServerReferenceId = addReactImport();
                const actionModuleId = getActionModuleId();
                const createRegisterCall = (identifier, exported = identifier) => {
                    const exportedName = t.isIdentifier(exported) ? exported.name : exported.value;
                    const call = t.callExpression(registerServerReferenceId, [
                        identifier,
                        t.stringLiteral(actionModuleId),
                        t.stringLiteral(exportedName),
                    ]);
                    // Wrap call with `;(() => { ... })();` to avoid issues with ASI
                    return t.expressionStatement(t.callExpression(t.arrowFunctionExpression([], call), []));
                };
                if (path.node.specifiers.length > 0) {
                    for (const specifier of path.node.specifiers) {
                        // `export * as ns from './foo';`
                        if (t.isExportNamespaceSpecifier(specifier)) {
                            throw path.buildCodeFrameError('Namespace exports for server actions are not supported. Re-export named actions instead: export { foo } from "./bar".');
                        }
                        else if (t.isExportDefaultSpecifier(specifier)) {
                            // NOTE: This is handled by ExportDefaultDeclaration
                            // `export default foo;`
                            throw path.buildCodeFrameError('Internal error while extracting server actions. Expected `export default variable;` to be extracted. (ExportDefaultSpecifier in ExportNamedDeclaration)');
                        }
                        else if (t.isExportSpecifier(specifier)) {
                            // `export { foo };`
                            // `export { foo as [bar|default] };`
                            const localName = specifier.local.name;
                            const exportedName = t.isIdentifier(specifier.exported)
                                ? specifier.exported.name
                                : specifier.exported.value;
                            // if we're reexporting an existing action under a new name, we shouldn't register() it again.
                            if (!state.file.metadata.extractedActions.some((info) => info.localName === localName)) {
                                // referencing the function's local identifier here *should* be safe (w.r.t. TDZ) because
                                // 1. if it's a `export async function foo() {}`, the declaration will be hoisted,
                                //    so it's safe to reference no matter how the declarations are ordered
                                // 2. if it's an `export const foo = async () => {}`, then the standalone `export { foo }`
                                //    has to follow the definition, so we can reference it right before the export decl as well
                                path.insertBefore(createRegisterCall(specifier.local, specifier.exported));
                            }
                            state.file.metadata.extractedActions.push({ localName, exportedName });
                        }
                    }
                    return;
                }
                if (!path.node.declaration) {
                    throw path.buildCodeFrameError(`Internal error: Unexpected 'ExportNamedDeclaration' without declarations`);
                }
                const identifiers = (() => {
                    const innerPath = path.get('declaration');
                    if (innerPath.isVariableDeclaration()) {
                        return innerPath.get('declarations').map((d) => {
                            // TODO: insert `typeof <identifier> === 'function'` check -- it's a variable, so it could be anything
                            const id = d.node.id;
                            if (!t.isIdentifier(id)) {
                                // TODO
                                throw innerPath.buildCodeFrameError('Unimplemented');
                            }
                            return id;
                        });
                    }
                    else if (innerPath.isFunctionDeclaration()) {
                        if (!innerPath.get('async')) {
                            throw innerPath.buildCodeFrameError(`Functions exported from "use server" files must be async.`);
                        }
                        return [innerPath.get('id').node];
                    }
                    else if (
                    // TypeScript type exports
                    innerPath.isTypeAlias() ||
                        innerPath.isTSDeclareFunction() ||
                        innerPath.isTSInterfaceDeclaration() ||
                        innerPath.isTSTypeAliasDeclaration()) {
                        return [];
                    }
                    else {
                        throw innerPath.buildCodeFrameError(`Unimplemented server action export`);
                    }
                })();
                path.insertAfter(identifiers.map((identifier) => createRegisterCall(identifier)));
                for (const identifier of identifiers) {
                    state.file.metadata.extractedActions.push({
                        localName: identifier.name,
                        exportedName: identifier.name,
                    });
                }
            },
        },
        post(file) {
            assertExpoMetadata(file.metadata);
            if (!file.metadata.extractedActions?.length) {
                return;
            }
            debug('extracted actions', file.metadata.extractedActions);
            const payload = {
                id: getActionModuleId(),
                names: file.metadata.extractedActions.map((e) => e.exportedName),
            };
            const stashedData = 'rsc/actions: ' + JSON.stringify(payload);
            // Add comment for debugging the bundle, we use the babel metadata for accessing the data.
            file.path.addComment('leading', stashedData);
            const filePath = file.opts.filename;
            if (!filePath) {
                // This can happen in tests or systems that use Babel standalone.
                throw new Error('[Babel] Expected a filename to be set in the state');
            }
            const outputKey = url_1.default.pathToFileURL(filePath).href;
            file.metadata.reactServerActions = payload;
            file.metadata.reactServerReference = outputKey;
        },
    };
}
exports.reactServerActionsPlugin = reactServerActionsPlugin;
const getFreeVariables = (path) => {
    const freeVariablesSet = new Set();
    const programScope = path.scope.getProgramParent();
    path.traverse({
        Identifier(innerPath) {
            const { name } = innerPath.node;
            if (!innerPath.isReferencedIdentifier()) {
                debug('skipping - not referenced');
                return;
            }
            if (freeVariablesSet.has(name)) {
                // we've already determined this name to be a free var. no point in recomputing.
                debug('skipping - already registered');
                return;
            }
            const binding = innerPath.scope.getBinding(name);
            if (!binding) {
                // probably a global, or an unbound variable. ignore it.
                debug('skipping - global or unbound, skipping');
                return;
            }
            if (binding.scope === programScope) {
                // module-level declaration. no need to close over it.
                debug('skipping - module-level binding');
                return;
            }
            if (
            // function args or a var at the top-level of its body
            binding.scope === path.scope ||
                // decls from blocks within the function
                isChildScope({
                    parent: path.scope,
                    child: binding.scope,
                    root: programScope,
                })) {
                // the binding came from within the function = it's not closed-over, so don't add it.
                debug('skipping - declared within function');
                return;
            }
            // we've (hopefully) eliminated all the other cases, so we should treat this as a free var.
            debug('adding');
            freeVariablesSet.add(name);
        },
    });
    return [...freeVariablesSet].sort();
};
const getFnPathName = (path) => {
    return path.isArrowFunctionExpression() ? undefined : path.node.id.name;
};
const isChildScope = ({ root, parent, child, }) => {
    let curScope = child;
    while (curScope !== root) {
        if (curScope.parent === parent) {
            return true;
        }
        curScope = curScope.parent;
    }
    return false;
};
const findLast = (arr, predicate) => {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i]))
            return arr[i];
    }
    return undefined;
};
function findImmediatelyEnclosingDeclaration(path) {
    let currentPath = path;
    while (!currentPath.isProgram()) {
        if (
        // const foo = async () => { ... }
        //       ^^^^^^^^^^^^^^^^^^^^^^^^^
        currentPath.isVariableDeclarator() ||
            // async function foo() { ... }
            // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            currentPath.isDeclaration()) {
            return currentPath;
        }
        // if we encounter an expression on the way, this isn't a top level decl, and needs to be hoisted.
        // e.g. `export const foo = withAuth(async () => { ... })`
        if (currentPath !== path && currentPath.isExpression()) {
            return null;
        }
        if (!currentPath.parentPath) {
            return null;
        }
        currentPath = currentPath.parentPath;
    }
    return null;
}
const getTopLevelBinding = (path) => {
    const decl = findImmediatelyEnclosingDeclaration(path);
    if (!decl || !('id' in decl.node) || !decl.node.id || !('name' in decl.node.id))
        return null;
    const declBinding = decl.scope.getBinding(decl.node.id.name);
    return declBinding.scope === path.scope.getProgramParent() ? declBinding : null;
};
const assertIsAsyncFn = (path) => {
    if (!path.node.async) {
        throw path.buildCodeFrameError(`functions marked with "use server" must be async`);
    }
};
const once = (fn) => {
    let cache = { has: false };
    return () => {
        if (cache.has)
            return cache.value;
        cache = { has: true, value: fn() };
        return cache.value;
    };
};
function assertExpoMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
        throw new Error('Expected Babel state.file.metadata to be an object');
    }
}
const getOrCreateInMap = (map, key, create) => {
    if (!map.has(key)) {
        const result = create();
        map.set(key, result);
        return [result, true];
    }
    return [map.get(key), false];
};
function hasUseServerDirective(path) {
    const { body } = path.node;
    return t.isBlockStatement(body) && body.directives.some((d) => d.value.value === 'use server');
}
const createAddNamedImportOnce = (t) => {
    const addedImportsCache = new Map();
    return function addNamedImportOnce(path, name, source) {
        const [sourceCache] = getOrCreateInMap(addedImportsCache, source, () => new Map());
        const [identifier, didCreate] = getOrCreateInMap(sourceCache, name, () => (0, helper_module_imports_1.addNamed)(path, name, source));
        // for cached imports, we need to clone the resulting identifier, because otherwise
        // '@babel/plugin-transform-modules-commonjs' won't replace the references to the import for some reason.
        // this is a helper for that.
        return didCreate ? identifier : t.cloneNode(identifier);
    };
};
