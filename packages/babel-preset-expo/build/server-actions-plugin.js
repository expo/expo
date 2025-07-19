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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactServerActionsPlugin = reactServerActionsPlugin;
const core_1 = require("@babel/core");
const node_path_1 = require("node:path");
const node_url_1 = __importDefault(require("node:url"));
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
            const freeVarsPat = core_1.types.arrayPattern(freeVariables.map((variable) => core_1.types.identifier(variable)));
            const closureExpr = core_1.types.memberExpression(closureParam, core_1.types.identifier(LAZY_WRAPPER_VALUE_KEY));
            extractedFunctionParams = [closureParam, ...path.node.params];
            extractedFunctionBody = [
                core_1.types.variableDeclaration('var', [
                    core_1.types.variableDeclarator(core_1.types.assignmentPattern(freeVarsPat, closureExpr)),
                ]),
                ...extractedFunctionBody,
            ];
        }
        const wrapInRegister = (expr, exportedName) => {
            const expoRegisterServerReferenceId = addReactImport();
            return core_1.types.callExpression(expoRegisterServerReferenceId, [
                expr,
                core_1.types.stringLiteral(actionModuleId),
                core_1.types.stringLiteral(exportedName),
            ]);
        };
        const isArrowFn = path.isArrowFunctionExpression();
        const extractedFunctionExpr = wrapInRegister(isArrowFn
            ? core_1.types.arrowFunctionExpression(extractedFunctionParams, core_1.types.blockStatement(extractedFunctionBody), true)
            : core_1.types.functionExpression(path.node.id, extractedFunctionParams, core_1.types.blockStatement(extractedFunctionBody), false, true), extractedIdentifier.name);
        // Create a top-level declaration for the extracted function.
        const bindingKind = 'var';
        const functionDeclaration = core_1.types.exportNamedDeclaration(core_1.types.variableDeclaration(bindingKind, [
            core_1.types.variableDeclarator(extractedIdentifier, extractedFunctionExpr),
        ]));
        // Insert the declaration as close to the original declaration as possible.
        const isPathFunctionInTopLevel = path.find((p) => p.isProgram()) === path;
        const decl = isPathFunctionInTopLevel ? path : findImmediatelyEnclosingDeclaration(path);
        let inserted;
        const canInsertExportNextToPath = (decl) => {
            if (!decl) {
                return false;
            }
            if (decl.parentPath?.isProgram()) {
                return true;
            }
            return false;
        };
        const findNearestPathThatSupportsInsertBefore = (decl) => {
            let current = decl;
            // Check if current scope is suitable for `export` insertion
            while (current && !current.isProgram()) {
                if (canInsertExportNextToPath(current)) {
                    return current;
                }
                const parentPath = current.parentPath;
                if (!parentPath) {
                    return null;
                }
                current = parentPath;
            }
            if (current.isFunction()) {
                // Don't insert exports inside functions
                return null;
            }
            return current;
        };
        const topLevelDecl = decl ? findNearestPathThatSupportsInsertBefore(decl) : null;
        if (topLevelDecl) {
            // If it's a variable declaration, insert before its parent statement to avoid syntax errors
            const targetPath = topLevelDecl.isVariableDeclarator()
                ? topLevelDecl.parentPath
                : topLevelDecl;
            [inserted] = targetPath.insertBefore(functionDeclaration);
            moduleScope.registerBinding(bindingKind, inserted);
            inserted.addComment('leading', ' hoisted action: ' + (getFnPathName(path) ?? '<anonymous>'), true);
        }
        else {
            // Fallback to inserting after the last import if no enclosing declaration is found
            const programBody = moduleScope.path.get('body');
            const lastImportPath = (Array.isArray(programBody) ? programBody : [programBody]).findLast((statement) => {
                return statement.isImportDeclaration();
            });
            [inserted] = lastImportPath.insertAfter(functionDeclaration);
            moduleScope.registerBinding(bindingKind, inserted);
            inserted.addComment('leading', ' hoisted action: ' + (getFnPathName(path) ?? '<anonymous>'), true);
        }
        return {
            inserted,
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
        const capturedVarsExpr = core_1.types.arrayExpression(freeVariables.map((variable) => core_1.types.identifier(variable)));
        const boundArgs = wrapBoundArgs(capturedVarsExpr);
        // _ACTION.bind(null, { get value() { return _encryptActionBoundArgs([x, y, z]) } })
        return core_1.types.callExpression(core_1.types.memberExpression(id, core_1.types.identifier('bind')), [
            core_1.types.nullLiteral(),
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
            const addNamedImportOnce = (0, common_1.createAddNamedImportOnce)(core_1.types);
            addReactImport = () => {
                return addNamedImportOnce(file.path, 'registerServerReference', 'react-server-dom-webpack/server');
            };
            getActionModuleId = once(() => {
                // Create relative file path hash.
                return './' + (0, common_1.toPosixPath)((0, node_path_1.relative)(projectRoot, file.opts.filename));
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
                const wrapperFn = core_1.types.cloneNode(defineBoundArgsWrapperHelper());
                return core_1.types.callExpression(wrapperFn, [core_1.types.arrowFunctionExpression([], expr)]);
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
                if (!core_1.types.isBlockStatement(body) || !hasUseServerDirective(path)) {
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
                    const bindingKind = 'var';
                    const [inserted] = path.replaceWith(core_1.types.variableDeclaration(bindingKind, [core_1.types.variableDeclarator(fnId, extractedIdentifier)]));
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
                    if (core_1.types.isFunctionDeclaration(path.node.declaration)) {
                        let { id } = path.node.declaration;
                        if (id == null) {
                            const moduleScope = path.scope.getProgramParent();
                            const extractedIdentifier = moduleScope.generateUidIdentifier('$$INLINE_ACTION');
                            id = extractedIdentifier;
                            // Transform `async function () {}` to `async function $$INLINE_ACTION() {}`
                            path.node.declaration.id = extractedIdentifier;
                        }
                        const exportedSpecifier = core_1.types.exportSpecifier(id, core_1.types.identifier('default'));
                        path.replaceWith(path.node.declaration);
                        path.insertAfter(core_1.types.exportNamedDeclaration(null, [exportedSpecifier]));
                    }
                    else {
                        // Convert anonymous function expressions to named function expressions and export them as default.
                        // export default foo = async () => {}
                        // vvv
                        // const foo = async () => {}
                        // (() => _registerServerReference(foo, "file:///unknown", "default"))();
                        // export { foo as default };
                        if (core_1.types.isAssignmentExpression(path.node.declaration) &&
                            core_1.types.isArrowFunctionExpression(path.node.declaration.right)) {
                            if (!core_1.types.isIdentifier(path.node.declaration.left)) {
                                throw path.buildCodeFrameError(`Expected an assignment to an identifier but found ${path.node.declaration.left.type}.`);
                            }
                            const { left, right } = path.node.declaration;
                            const id = left;
                            const exportedSpecifier = core_1.types.exportSpecifier(id, core_1.types.identifier('default'));
                            // Replace `export default foo = async () => {}` with `const foo = async () => {}`
                            path.replaceWith(core_1.types.variableDeclaration('var', [core_1.types.variableDeclarator(id, right)]));
                            // Insert `(() => _registerServerReference(foo, "file:///unknown", "default"))();`
                            path.insertAfter(core_1.types.exportNamedDeclaration(null, [exportedSpecifier]));
                        }
                        else if (core_1.types.isArrowFunctionExpression(path.node.declaration) &&
                            path.node.declaration) {
                            // export default async () => {}
                            // Give the function a name
                            // const $$INLINE_ACTION = async () => {}
                            const moduleScope = path.scope.getProgramParent();
                            const extractedIdentifier = moduleScope.generateUidIdentifier('$$INLINE_ACTION');
                            // @ts-expect-error: Transform `export default async () => {}` to `const $$INLINE_ACTION = async () => {}`
                            path.node.declaration = core_1.types.variableDeclaration('var', [
                                core_1.types.variableDeclarator(extractedIdentifier, path.node.declaration),
                            ]);
                            // Strip the `export default`
                            path.replaceWith(path.node.declaration);
                            // export { $$INLINE_ACTION as default }
                            const exportedSpecifier = core_1.types.exportSpecifier(extractedIdentifier, core_1.types.identifier('default'));
                            path.insertAfter(core_1.types.exportNamedDeclaration(null, [exportedSpecifier]));
                        }
                        else if (
                        // Match `export default foo;`
                        core_1.types.isIdentifier(path.node.declaration)) {
                            // Ensure the `path.node.declaration` is a function or a variable for a function.
                            const binding = path.scope.getBinding(path.node.declaration.name);
                            const isServerActionType = core_1.types.isFunctionDeclaration(binding?.path.node ?? path.node.declaration) ||
                                core_1.types.isArrowFunctionExpression(binding?.path.node ?? path.node.declaration) ||
                                // `const foo = async () => {}`
                                (core_1.types.isVariableDeclarator(binding?.path.node) &&
                                    core_1.types.isArrowFunctionExpression(binding?.path.node.init));
                            if (isServerActionType) {
                                // Convert `export default foo;` to `export { foo as default };`
                                const exportedSpecifier = core_1.types.exportSpecifier(path.node.declaration, core_1.types.identifier('default'));
                                path.replaceWith(core_1.types.exportNamedDeclaration(null, [exportedSpecifier]));
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
                // Skip type-only exports (`export type { Foo } from '...'` or `export { type Foo }`)
                if (path.node.exportKind === 'type') {
                    return;
                }
                // This can happen with `export {};` and TypeScript types.
                if (!path.node.declaration && !path.node.specifiers.length) {
                    return;
                }
                const actionModuleId = getActionModuleId();
                const createRegisterCall = (identifier, exported = identifier) => {
                    const exportedName = core_1.types.isIdentifier(exported) ? exported.name : exported.value;
                    const call = core_1.types.callExpression(addReactImport(), [
                        identifier,
                        core_1.types.stringLiteral(actionModuleId),
                        core_1.types.stringLiteral(exportedName),
                    ]);
                    // Wrap call with `;(() => { ... })();` to avoid issues with ASI
                    return core_1.types.expressionStatement(core_1.types.callExpression(core_1.types.arrowFunctionExpression([], call), []));
                };
                if (path.node.specifiers.length > 0) {
                    for (const specifier of path.node.specifiers) {
                        // `export * as ns from './foo';`
                        if (core_1.types.isExportNamespaceSpecifier(specifier)) {
                            throw path.buildCodeFrameError('Namespace exports for server actions are not supported. Re-export named actions instead: export { foo } from "./bar".');
                        }
                        else if (core_1.types.isExportDefaultSpecifier(specifier)) {
                            // NOTE: This is handled by ExportDefaultDeclaration
                            // `export default foo;`
                            throw path.buildCodeFrameError('Internal error while extracting server actions. Expected `export default variable;` to be extracted. (ExportDefaultSpecifier in ExportNamedDeclaration)');
                        }
                        else if (core_1.types.isExportSpecifier(specifier)) {
                            // Skip TypeScript type re-exports (e.g., `export { type Foo }`)
                            if (specifier.exportKind === 'type') {
                                continue;
                            }
                            // `export { foo };`
                            // `export { foo as [bar|default] };`
                            const localName = specifier.local.name;
                            const exportedName = core_1.types.isIdentifier(specifier.exported)
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
                            if (!core_1.types.isIdentifier(id)) {
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
            const outputKey = node_url_1.default.pathToFileURL(filePath).href;
            file.metadata.reactServerActions = payload;
            file.metadata.reactServerReference = outputKey;
        },
    };
}
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
    return path.isArrowFunctionExpression() ? undefined : path.node?.id?.name;
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
function hasUseServerDirective(path) {
    const { body } = path.node;
    return core_1.types.isBlockStatement(body) && body.directives.some((d) => d.value.value === 'use server');
}
