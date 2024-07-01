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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isShakingEnabled = exports.accessAst = exports.treeShakeSerializer = exports.isModuleEmptyFor = void 0;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const code_frame_1 = require("@babel/code-frame");
const core_1 = require("@babel/core");
const babylon = __importStar(require("@babel/parser"));
const types = __importStar(require("@babel/types"));
const sideEffects_1 = require("./sideEffects");
const debug = require('debug')('expo:treeshaking');
const OPTIMIZE_GRAPH = true;
const generate = require('@babel/generator').default;
function isModuleEmptyFor(ast) {
    if (!ast?.program.body.length) {
        return true;
    }
    let isEmptyOrCommentsAndUseStrict = true; // Assume true until proven otherwise
    (0, core_1.traverse)(ast, {
        enter(path) {
            const { node } = path;
            // If it's not a Directive, ExpressionStatement, or empty body,
            // it means we have actual code
            if (node.type !== 'Directive' &&
                node.type !== 'ExpressionStatement' &&
                !(node.type === 'Program' && node.body.length === 0)) {
                isEmptyOrCommentsAndUseStrict = false;
                path.stop(); // No need to traverse further
            }
        },
        // If we encounter any non-comment nodes, it's not empty
        noScope: true,
    });
    return isEmptyOrCommentsAndUseStrict;
}
exports.isModuleEmptyFor = isModuleEmptyFor;
function isEmptyModule(value) {
    return value.output.every((outputItem) => {
        return isModuleEmptyFor(accessAst(outputItem));
    });
}
// Collect a list of exports that are not used within the module.
function getExportsThatAreNotUsedInModule(ast) {
    const exportedIdentifiers = new Set();
    const usedIdentifiers = new Set();
    const unusedExports = [];
    // First pass: collect all export identifiers
    (0, core_1.traverse)(ast, {
        ExportNamedDeclaration(path) {
            const { declaration, specifiers } = path.node;
            if (declaration) {
                if ('declarations' in declaration && declaration.declarations) {
                    declaration.declarations.forEach((decl) => {
                        if (types.isIdentifier(decl.id)) {
                            exportedIdentifiers.add(decl.id.name);
                        }
                    });
                }
                else if ('id' in declaration && types.isIdentifier(declaration.id)) {
                    exportedIdentifiers.add(declaration.id.name);
                }
            }
            specifiers.forEach((spec) => {
                if (types.isIdentifier(spec.exported)) {
                    exportedIdentifiers.add(spec.exported.name);
                }
            });
        },
        ExportDefaultDeclaration(path) {
            // Default exports need to be handled separately
            // Assuming the default export is a function or class declaration:
            if ('id' in path.node.declaration && types.isIdentifier(path.node.declaration.id)) {
                exportedIdentifiers.add(path.node.declaration.id.name);
            }
        },
    });
    // Second pass: find all used identifiers
    (0, core_1.traverse)(ast, {
        Identifier(path) {
            if (path.isReferencedIdentifier()) {
                // console.log('referenced:', path.node.name);
                usedIdentifiers.add(path.node.name);
            }
        },
    });
    // console.log('exported:', exportedIdentifiers, 'used:', usedIdentifiers);
    // Determine which exports are unused
    exportedIdentifiers.forEach((exported) => {
        if (!usedIdentifiers.has(exported)) {
            unusedExports.push(exported);
        }
    });
    return unusedExports;
}
function populateGraphWithAst(graph) {
    // Generate AST for all modules.
    graph.dependencies.forEach((value) => {
        if (
        // No tree shaking needed for JSON files.
        value.path.endsWith('.json')) {
            return;
        }
        value.output.forEach((output) => {
            if (output.type !== 'js/module') {
                return;
            }
            if (
            // This is a hack to prevent modules that are already wrapped from being included.
            output.data.code.startsWith('__d(function ')) {
                // TODO: This should probably assert.
                debug('Skipping tree-shake for wrapped module: ' + value.path);
                return;
            }
            try {
                // @ts-expect-error: ast is not on type.
                output.data.ast ??= babylon.parse(output.data.code, { sourceType: 'unambiguous' });
            }
            catch (error) {
                if (error instanceof SyntaxError && isBabelSyntaxError(error)) {
                    // TODO: Unify with similar error handling in the transformer.
                    // Print code frame for syntax errors.
                    const frame = (0, code_frame_1.codeFrameColumns)(output.data.code, { start: { line: error.loc.line, column: error.loc.column } }, { highlightCode: true });
                    console.error(`[Optimizer] Syntax error in ${value.path}:\n${frame}`);
                }
                else {
                    console.error(`[Optimizer] Failed to parse AST for: ${value.path}\n----\n${output.data.code}\n----`);
                }
                throw error;
            }
        });
    });
}
function isBabelSyntaxError(error) {
    return 'loc' in error && !!error.loc && typeof error.loc === 'object';
}
function populateModuleWithImportUsage(value) {
    function getGraphId(moduleId) {
        const key = [...value.dependencies.values()].find((dep) => {
            return dep.data.name === moduleId;
        })?.absolutePath;
        if (!key) {
            // This can be nullish with optional dependencies in a try/catch that don't resolve.
            return null;
            // throw new Error(
            //   `Failed to find graph key for import "${moduleId}" in module "${
            //     value.path
            //   }". Options: ${[...value.dependencies.values()].map((v) => v.data.name).join(', ')}`
            // );
        }
        return key;
    }
    for (const index in value.output) {
        const outputItem = value.output[index];
        if (!outputItem.data.modules) {
            outputItem.data.modules = {
                imports: [],
            };
        }
        outputItem.data.modules.imports = [];
        const ast = accessAst(outputItem);
        (0, core_1.traverse)(ast, {
            // Traverse and collect import/export statements.
            ImportDeclaration(path) {
                const source = path.node.source.value;
                const specifiers = path.node.specifiers.map((specifier) => {
                    return {
                        type: specifier.type,
                        importedName: types.isImportSpecifier(specifier) && types.isIdentifier(specifier.imported)
                            ? specifier.imported.name
                            : null,
                        localName: specifier.local.name,
                    };
                });
                outputItem.data.modules.imports.push({
                    source,
                    key: getGraphId(source),
                    specifiers,
                    // path,
                });
            },
            // Track require calls
            CallExpression(path) {
                if (path.node.callee.type === 'Identifier' && path.node.callee.name === 'require') {
                    const arg = path.node.arguments[0];
                    if (arg.type === 'StringLiteral') {
                        outputItem.data.modules.imports.push({
                            source: arg.value,
                            key: getGraphId(arg.value),
                            specifiers: [],
                            cjs: true,
                        });
                    }
                }
                // Async import calls
                if (path.node.callee.type === 'Import') {
                    const arg = path.node.arguments[0];
                    if (arg.type === 'StringLiteral') {
                        outputItem.data.modules.imports.push({
                            source: arg.value,
                            key: getGraphId(arg.value),
                            specifiers: [],
                            async: true,
                        });
                    }
                }
                // require.resolveWeak calls
                if (path.node.callee.type === 'MemberExpression' &&
                    path.node.callee.object.type === 'Identifier' &&
                    path.node.callee.object.name === 'require' &&
                    path.node.callee.property.type === 'Identifier' &&
                    path.node.callee.property.name === 'resolveWeak') {
                    const arg = path.node.arguments[0];
                    if (arg.type === 'StringLiteral') {
                        outputItem.data.modules.imports.push({
                            source: arg.value,
                            key: getGraphId(arg.value),
                            specifiers: [],
                            weak: true,
                        });
                    }
                }
                // TODO: Maybe also add require.context.
            },
            // export { a as b } from 'a'
            // export { c } from 'a'
            // export { default } from 'a'
            ExportNamedDeclaration(path) {
                if (path.node.source) {
                    const source = path.node.source.value;
                    const specifiers = path.node.specifiers.map((specifier) => {
                        const exportedName = types.isIdentifier(specifier.exported)
                            ? specifier.exported.name
                            : specifier.exported.value;
                        const localName = 'local' in specifier ? specifier.local.name : exportedName;
                        return {
                            type: specifier.type,
                            exportedName,
                            importedName: localName,
                            localName,
                        };
                    });
                    outputItem.data.modules.imports.push({
                        source,
                        key: getGraphId(source),
                        specifiers,
                    });
                }
            },
            // export * from 'a'
            // TODO: export * as b from 'a'
            ExportAllDeclaration(path) {
                if (path.node.source) {
                    const source = path.node.source.value;
                    outputItem.data.modules.imports.push({
                        source,
                        key: getGraphId(source),
                        specifiers: [],
                        star: true,
                    });
                }
            },
        });
        outputItem.data.modules.imports = outputItem.data.modules.imports.filter(
        // Filter out missing optional dependencies.
        (importItem) => importItem.key != null);
    }
}
const markUnused = (path) => {
    // Format path as code
    // console.log('Delete:\n' + generate(path.node).code);
    // console.log();
    path.remove();
};
async function treeShakeSerializer(entryPoint, preModules, graph, options) {
    if (!isShakingEnabled(graph, options)) {
        return [entryPoint, preModules, graph, options];
    }
    // Generate AST for all modules.
    populateGraphWithAst(graph);
    if (!OPTIMIZE_GRAPH) {
        // Useful for testing the transform reconciler...
        return [entryPoint, preModules, graph, options];
    }
    const starExportsForModules = new Map();
    for (const value of graph.dependencies.values()) {
        // TODO: Move this to the transformer and combine with collect dependencies.
        getExportsForModule(value);
    }
    // This pass will parse all modules back to AST and include the import/export statements.
    for (const value of graph.dependencies.values()) {
        // TODO: Move this to the transformer and combine with collect dependencies.
        populateModuleWithImportUsage(value);
    }
    function getExportsForModule(value, checkedModules = new Set()) {
        if (starExportsForModules.has(value.path)) {
            return starExportsForModules.get(value.path);
        }
        if (checkedModules.has(value.path)) {
            // TODO: Handle circular dependencies.
            throw new Error('Circular dependency detected while tree-shaking: ' + value.path);
            // return {
            //   exportNames: [],
            //   isStatic: true,
            //   hasUnresolvableStarExport: true,
            // };
        }
        checkedModules.add(value.path);
        function getDepForImportId(importModuleId) {
            // The hash key for the dependency instance in the module.
            const targetHashId = getDependencyHashIdForImportModuleId(value, importModuleId);
            // console.log('targetModulePath', targetHashId);
            // If the dependency was already removed, then we don't need to do anything.
            const importInstance = value.dependencies.get(targetHashId);
            // console.log('Try unlink:', importModuleId, dep);
            const graphEntryForTargetImport = graph.dependencies.get(importInstance.absolutePath);
            // Should never happen but we're playing with fire here.
            if (!graphEntryForTargetImport) {
                throw new Error(`Failed to find graph key for re-export "${importModuleId}" while optimizing ${value.path}. Options: ${[...value.dependencies.values()].map((v) => v.data.name).join(', ')}`);
            }
            return graphEntryForTargetImport;
        }
        const exportNames = [];
        // Indicates that the module does not have any dynamic exports, e.g. `module.exports`, `Object.assign(exports)`, etc.
        let isStatic = true;
        let hasUnresolvableStarExport = false;
        for (const index in value.output) {
            const outputItem = value.output[index];
            // console.log(outputItem);
            const ast = accessAst(outputItem);
            if (!ast)
                continue;
            // Detect if the module is static...
            if (outputItem.data.hasCjsExports) {
                isStatic = false;
            }
            (0, core_1.traverse)(ast, {
                // export * from 'a'
                // NOTE: This only runs on normal `* from` syntax as `* as X from` is converted to an import.
                ExportAllDeclaration(path) {
                    if (path.node.source) {
                        // Get module for import ID:
                        const nextModule = getDepForImportId(path.node.source.value);
                        const exportResults = getExportsForModule(nextModule, checkedModules);
                        console.log('exportResults', exportResults);
                        if (exportResults.isStatic && !exportResults.hasUnresolvableStarExport) {
                            // Collect all exports from the module.
                            // exportNames.push(...exportResults.exportNames);
                            // Convert the export all to named exports.
                            // ```
                            // export * from 'a';
                            // ```
                            // becomes
                            // ```
                            // export { a, b, c } from 'a';
                            // ```
                            // NOTE: It's import we only use one statement so we don't skew the multi-dep tracking from collect dependencies.
                            path.replaceWithMultiple([
                                // @ts-expect-error: missing type
                                types.ExportNamedDeclaration(null, exportResults.exportNames.map((exportName) => types.exportSpecifier(types.identifier(exportName), types.identifier(exportName))), types.stringLiteral(path.node.source.value)),
                            ]);
                        }
                        else {
                            console.log('cannot resolve star export:', nextModule.path);
                            hasUnresolvableStarExport = true;
                        }
                        // Collect all exports from the module.
                        // If list of exports does not contain any CJS, then re-write the export all as named exports.
                    }
                },
            });
            // Collect export names
            (0, core_1.traverse)(ast, {
                ExportNamedDeclaration(path) {
                    const { declaration, specifiers } = path.node;
                    if (declaration) {
                        if ('declarations' in declaration && declaration.declarations) {
                            declaration.declarations.forEach((decl) => {
                                if (types.isIdentifier(decl.id)) {
                                    exportNames.push(decl.id.name);
                                }
                            });
                        }
                        else if ('id' in declaration && types.isIdentifier(declaration.id)) {
                            exportNames.push(declaration.id.name);
                        }
                    }
                    specifiers.forEach((spec) => {
                        if (types.isIdentifier(spec.exported)) {
                            exportNames.push(spec.exported.name);
                        }
                    });
                },
                ExportDefaultDeclaration(path) {
                    // Default exports need to be handled separately
                    // Assuming the default export is a function or class declaration
                    if ('id' in path.node.declaration && types.isIdentifier(path.node.declaration.id)) {
                        exportNames.push(path.node.declaration.id.name);
                    }
                    // If it's an expression, then it's a static export.
                    isStatic = true;
                },
            });
            console.log('OUTPUT:', value.path + '\n\n' + generate(ast).code);
        }
        const starExport = {
            exportNames,
            isStatic,
            hasUnresolvableStarExport,
        };
        starExportsForModules.set(value.path, starExport);
        return starExport;
    }
    // return [entryPoint, preModules, graph, options];
    const beforeList = [...graph.dependencies.keys()];
    // Tree shake the graph.
    // treeShakeAll();
    optimizePaths([entryPoint]);
    // Debug pass: Print all orphaned modules.
    for (const [, value] of graph.dependencies.entries()) {
        if (value.inverseDependencies.size === 0) {
            console.log('Orphan:', value.path);
        }
        else {
            let hasNormalNode = false;
            for (const dep of value.inverseDependencies) {
                if (!graph.dependencies.has(dep)) {
                    console.log(`ISSUE: Dependency: ${value.path}, has inverse relation to missing node: ${dep}`);
                }
                else {
                    hasNormalNode = true;
                }
            }
            if (!hasNormalNode) {
                console.error(`ERROR: All inverse dependencies are missing for: ${value.path}`);
                // TODO: Make this not happen ever
                // graph.dependencies.delete(depId);
            }
        }
    }
    const afterList = [...graph.dependencies.keys()];
    // Print the removed modules:
    const removedModules = beforeList.filter((value) => !afterList.includes(value));
    console.log('Fully removed:', removedModules.sort());
    // console.log('ALL:', JSON.stringify(afterList, null, 2));
    return [entryPoint, preModules, graph, options];
    function disposeOfGraphNode(nodePath) {
        const node = graph.dependencies.get(nodePath);
        if (!node)
            return;
        // Recursively remove all dependencies.
        for (const dep of node.dependencies.values()) {
            const child = graph.dependencies.get(dep.absolutePath);
            if (!child)
                continue;
            // TODO: Might need to clean up the multi-dep tracking, e.g. importInstance.data.data.locs.pop();
            // Remove inverse dependency on the node we're about to delete.
            child.inverseDependencies.delete(nodePath);
            // If the child has no more dependencies, then remove it from the graph too.
            if (child.inverseDependencies.size === 0) {
                disposeOfGraphNode(dep.absolutePath);
            }
        }
        // @ts-expect-error
        graph.dependencies.delete(nodePath);
    }
    function getDependencyHashIdForImportModuleId(graphModule, importModuleId) {
        // Unlink the module in the graph
        // The hash key for the dependency instance in the module.
        const depId = [...graphModule.dependencies.entries()].find(([key, dep]) => {
            return dep.data.name === importModuleId;
        })?.[0];
        // // Should never happen but we're playing with fire here.
        if (!depId) {
            throw new Error(`Failed to find graph key for import "${importModuleId}" from "${importModuleId}" while optimizing ${graphModule.path}. Options: ${[...graphModule.dependencies.values()].map((v) => v.data.name).join(', ')}`);
        }
        return depId;
    }
    function disconnectGraphNode(graphModule, importModuleId, { isSideEffectyImport } = {}) {
        // Unlink the module in the graph
        // The hash key for the dependency instance in the module.
        const targetHashId = getDependencyHashIdForImportModuleId(graphModule, importModuleId);
        // console.log('targetModulePath', targetHashId);
        // If the dependency was already removed, then we don't need to do anything.
        const importInstance = graphModule.dependencies.get(targetHashId);
        // console.log('Try unlink:', importModuleId, dep);
        const graphEntryForTargetImport = graph.dependencies.get(importInstance.absolutePath);
        // Should never happen but we're playing with fire here.
        if (!graphEntryForTargetImport) {
            throw new Error(`Failed to find graph key for re-export "${importModuleId}" while optimizing ${graphModule.path}. Options: ${[...graphModule.dependencies.values()].map((v) => v.data.name).join(', ')}`);
        }
        const [authorMarkedSideEffect, trace] = (0, sideEffects_1.hasSideEffectWithDebugTrace)(options, graph, graphEntryForTargetImport);
        // If the package.json chain explicitly marks the module as side-effect-free, then we can remove imports that have no specifiers.
        const isFx = authorMarkedSideEffect ?? isSideEffectyImport;
        if (isSideEffectyImport) {
            if (authorMarkedSideEffect == null) {
                // This is for debugging modules that should be marked as side-effects but are not.
                if (!trace.length) {
                    console.log('----');
                    console.log('Found side-effecty import (no specifiers) that is not marked as a side effect in the package.json:');
                    console.log('- Origin module:', graphModule.path);
                    console.log('- Module ID (needs marking):', importModuleId);
                    // console.log('- FX trace:', trace.join(' > '));
                    console.log('----');
                }
            }
            else if (!isFx) {
                console.log('Removing side-effecty import (package.json indicates it is not a side-effect):', importModuleId, 'from:', graphModule.path);
            }
        }
        // let trace: string[] = [];
        if (
        // Don't remove the module if it has side effects.
        !isFx ||
            // Unless it's an empty module.
            isEmptyModule(graphEntryForTargetImport)) {
            // Remove a random instance of the dep count to track if there are multiple imports.
            // TODO: Get the exact instance of the import.
            // @ts-expect-error: typed as readonly
            importInstance.data.data.locs.pop();
            if (importInstance.data.data.locs.length === 0) {
                // console.log('Remove import instance:', depId);
                // Remove dependency from this module so it doesn't appear in the dependency map.
                graphModule.dependencies.delete(targetHashId);
                // Remove inverse link to this dependency
                graphEntryForTargetImport.inverseDependencies.delete(graphModule.path);
                if (graphEntryForTargetImport.inverseDependencies.size === 0) {
                    console.log('Unlink module from graph:', importInstance.absolutePath);
                    // Remove the dependency from the graph as no other modules are using it anymore.
                    disposeOfGraphNode(importInstance.absolutePath);
                }
            }
            // Mark the module as removed so we know to traverse again.
            return { path: importInstance.absolutePath, removed: true };
        }
        else {
            if (isFx) {
                console.log('Skip graph unlinking due to side-effect:');
                console.log('- Origin module:', graphModule.path);
                console.log('- Module ID:', importModuleId);
                console.log('- FX trace:', trace.join(' > '));
            }
            else {
                console.log('Skip graph unlinking:', {
                    depId: targetHashId,
                    isFx,
                });
            }
        }
        return { path: importInstance.absolutePath, removed: false };
    }
    function removeUnusedExports(value, depth = 0) {
        if (!accessAst(value.output[0])) {
            return [];
        }
        if (!value.inverseDependencies.size) {
            return [];
        }
        if (depth > 5) {
            debug('Max export removal depth reached for:', value.path);
            return [];
        }
        const dirtyImports = [];
        let needsImportReindex = false;
        let shouldRecurseUnusedExports = false;
        const inverseDeps = [
            // @ts-expect-error: Type 'Iterator<string, any, undefined>' must have a '[Symbol.iterator]()' method that returns an iterator.
            ...value.inverseDependencies.values(),
        ].map((id) => {
            return graph.dependencies.get(id);
        });
        const isExportUsed = (importName) => {
            return inverseDeps.some((dep) => {
                return dep?.output.some((outputItem) => {
                    if (outputItem.type === 'js/module') {
                        const imports = outputItem.data.modules?.imports;
                        if (imports) {
                            return imports.some((importItem) => {
                                if (importItem.key !== value.path) {
                                    return false;
                                }
                                // If the import is CommonJS, then we can't tree-shake it.
                                if (importItem.cjs || importItem.star || importItem.async) {
                                    return true;
                                }
                                return importItem.specifiers.some((specifier) => {
                                    if (specifier.type === 'ImportDefaultSpecifier') {
                                        return importName === 'default';
                                    }
                                    // Star imports are always used.
                                    if (specifier.type === 'ImportNamespaceSpecifier') {
                                        return true;
                                    }
                                    // `export { default as add } from './add'`
                                    if (specifier.type === 'ExportSpecifier') {
                                        return specifier.localName === importName;
                                    }
                                    return (specifier.importedName === importName || specifier.exportedName === importName);
                                });
                            });
                        }
                    }
                    return false;
                });
            });
        };
        for (const index in value.output) {
            const outputItem = value.output[index];
            const ast = accessAst(outputItem);
            if (!ast) {
                throw new Error('AST missing for module: ' + value.path);
            }
            // Collect a list of exports that are not used within the module.
            const possibleUnusedExports = getExportsThatAreNotUsedInModule(ast);
            // Traverse exports and mark them as used or unused based on if inverse dependencies are importing them.
            (0, core_1.traverse)(ast, {
                ExportDefaultDeclaration(path) {
                    if (possibleUnusedExports.includes('default') && !isExportUsed('default')) {
                        markUnused(path);
                    }
                },
                ExportNamedDeclaration(path) {
                    // Remove specifiers, e.g. `export { Foo, Bar as Bax }`
                    if (types.isExportNamedDeclaration(path.node)) {
                        for (let i = 0; i < path.node.specifiers.length; i++) {
                            const specifier = path.node.specifiers[i];
                            if (types.isExportSpecifier(specifier) &&
                                types.isIdentifier(specifier.local) &&
                                types.isIdentifier(specifier.exported) &&
                                possibleUnusedExports.includes(specifier.exported.name) &&
                                !isExportUsed(specifier.exported.name)) {
                                needsImportReindex = true;
                                // Remove specifier
                                path.node.specifiers.splice(i, 1);
                                i--;
                            }
                        }
                    }
                    // Remove the entire node if the export has been completely removed.
                    const importModuleId = path.node.source?.value;
                    const declaration = path.node.declaration;
                    if (types.isVariableDeclaration(declaration)) {
                        declaration.declarations.forEach((decl) => {
                            if (decl.id.type === 'Identifier') {
                                if (possibleUnusedExports.includes(decl.id.name) && !isExportUsed(decl.id.name)) {
                                    markUnused(path);
                                    console.log(`mark remove (type: var, depth: ${depth}):`, decl.id.name, 'from:', value.path);
                                    // Account for variables, and classes which may contain references to other exports.
                                    shouldRecurseUnusedExports = true;
                                }
                            }
                        });
                    }
                    else if (declaration && 'id' in declaration && types.isIdentifier(declaration.id)) {
                        // function, class, etc.
                        if (possibleUnusedExports.includes(declaration.id.name) &&
                            !isExportUsed(declaration.id.name)) {
                            console.log(`mark remove (type: function, depth: ${depth}):`, declaration.id.name, 'from:', value.path);
                            markUnused(path);
                            // Code inside of an unused export may affect other exports in the module.
                            // e.g.
                            //
                            // export const a = () => {}
                            //
                            // // Removed `b` -> recurse for `a`
                            // export const b = () => { a() };
                            //
                            shouldRecurseUnusedExports = true;
                        }
                    }
                    if (importModuleId) {
                        if (path.node.specifiers.length === 0) {
                            const removeRequest = disconnectGraphNode(value, importModuleId);
                            if (removeRequest.removed) {
                                needsImportReindex = true;
                                dirtyImports.push(removeRequest.path);
                                markUnused(path);
                            }
                        }
                    }
                },
            });
        }
        if (needsImportReindex) {
            // TODO: Do this better with a tracked removal of the import rather than a full reparse.
            populateModuleWithImportUsage(value);
        }
        if (shouldRecurseUnusedExports) {
            return unique(removeUnusedExports(value, depth + 1).concat(dirtyImports));
        }
        return unique(dirtyImports);
    }
    function removeUnusedImportsFromModule(value, ast) {
        // json, asset, script, etc.
        if (!ast) {
            return [];
        }
        // Traverse imports and remove unused imports.
        // Keep track of all the imported identifiers
        const importedIdentifiers = new Set();
        // Keep track of all used identifiers
        const usedIdentifiers = new Set();
        const importDecs = [];
        (0, core_1.traverse)(ast, {
            ImportSpecifier(path) {
                if (
                // Support `import { foo as bar } from './foo'`
                path.node.local.name != null) {
                    importedIdentifiers.add(path.node.local.name);
                }
                else if (
                // Support `import { foo } from './foo'`
                types.isIdentifier(path.node.imported) &&
                    path.node.imported.name != null) {
                    importedIdentifiers.add(path.node.imported.name);
                }
                else {
                    console.log(path);
                    throw new Error('Unknown import specifier: ' + path.node.type);
                }
            },
            ImportDefaultSpecifier(path) {
                importedIdentifiers.add(path.node.local.name);
            },
            ImportNamespaceSpecifier(path) {
                importedIdentifiers.add(path.node.local.name);
            },
            Identifier(path) {
                // Make sure this identifier isn't coming from an import specifier
                if (path.findParent((path) => path.isImportSpecifier())) {
                    return;
                }
                if (!path.scope.bindingIdentifierEquals(path.node.name, path.node)) {
                    usedIdentifiers.add(path.node.name);
                }
            },
            ImportDeclaration(path) {
                // console.log(path);
                // Mark the path with some metadata indicating that it originally had `n` specifiers.
                // This is used to determine if the import was side-effecty.
                // NOTE: This could be a problem if the AST is re-parsed.
                // TODO: This doesn't account for `import {} from './foo'`
                // @ts-expect-error: custom property
                path.opts.originalSpecifiers ??= path.node.specifiers.length;
                importDecs.push(path);
            },
        });
        const dirtyImports = [];
        if (!importDecs.length) {
            return dirtyImports;
        }
        // Determine unused identifiers by subtracting the used from the imported
        const unusedImports = [...importedIdentifiers].filter((identifier) => !usedIdentifiers.has(identifier));
        // Remove the unused imports from the AST
        importDecs.forEach((path, index) => {
            const originalSize = path.node.specifiers.length;
            // @ts-expect-error: custom property
            const absoluteOriginalSize = path.opts.originalSpecifiers ?? originalSize;
            path.node.specifiers = path.node.specifiers.filter((specifier) => {
                if (specifier.type === 'ImportDefaultSpecifier') {
                    return !unusedImports.includes(specifier.local.name);
                }
                else if (specifier.type === 'ImportNamespaceSpecifier') {
                    return !unusedImports.includes(specifier.local.name);
                }
                else if (types.isIdentifier(specifier.imported)) {
                    return !unusedImports.includes(specifier.imported.name);
                }
                return false;
            });
            const importModuleId = path.node.source.value;
            if (originalSize !== path.node.specifiers.length) {
                // The hash key for the dependency instance in the module.
                const targetHashId = getDependencyHashIdForImportModuleId(value, importModuleId);
                const importInstance = value.dependencies.get(targetHashId);
                if (importInstance) {
                    dirtyImports.push(importInstance.absolutePath);
                }
            }
            // If no specifiers are left after filtering, remove the whole import declaration
            // e.g. `import './unused'` or `import {} from './unused'` -> remove.
            if (path.node.specifiers.length === 0) {
                // TODO: Ensure the module isn't side-effect-ful or importing a module that is side-effect-ful.
                const removeRequest = disconnectGraphNode(value, importModuleId, {
                    isSideEffectyImport: absoluteOriginalSize === 0 ? true : undefined,
                });
                if (removeRequest.removed) {
                    console.log('Disconnect import:', importModuleId, 'from:', value.path);
                    // Delete the import AST
                    markUnused(path);
                    dirtyImports.push(removeRequest.path);
                }
            }
        });
        return unique(dirtyImports);
    }
    function removeUnusedImports(value) {
        if (!value.dependencies.size) {
            return [];
        }
        const dirtyImports = value.output
            .map((outputItem) => {
            return removeUnusedImportsFromModule(value, accessAst(outputItem));
        })
            .flat();
        if (dirtyImports.length) {
            // TODO: Do this better with a tracked removal of the import rather than a full reparse.
            populateModuleWithImportUsage(value);
        }
        return dirtyImports;
    }
    function unique(array) {
        return Array.from(new Set(array));
    }
    function optimizePaths(paths) {
        const checked = new Set();
        function markDirty(...paths) {
            paths.forEach((path) => {
                checked.delete(path);
                paths.push(path);
            });
        }
        // This pass will annotate the AST with the used and unused exports.
        while (paths.length) {
            const absolutePath = paths.pop();
            if (absolutePath == null)
                continue;
            if (checked.has(absolutePath)) {
                // console.log('Bail:', absolutePath);
                continue;
            }
            const dep = graph.dependencies.get(absolutePath);
            if (!dep)
                continue;
            // console.log('Optimize:', absolutePath);
            checked.add(absolutePath);
            markDirty(
            // Order is important (not sure why though)
            ...removeUnusedExports(dep), 
            // Remove imports after exports
            ...removeUnusedImports(dep));
            // Optimize all deps without marking as dirty to prevent
            // circular dependencies from creating infinite loops.
            dep.dependencies.forEach((dep) => {
                paths.push(dep.absolutePath);
            });
        }
        // Print if any dependencies weren't checked (this shouldn't happen)
        const unchecked = [...graph.dependencies.keys()].filter((key) => !checked.has(key));
        if (unchecked.length) {
            console.log('[ERROR]: Unchecked:', unchecked);
        }
    }
}
exports.treeShakeSerializer = treeShakeSerializer;
function accessAst(output) {
    // @ts-expect-error
    return output.data.ast;
}
exports.accessAst = accessAst;
function isShakingEnabled(graph, options) {
    return String(graph.transformOptions.customTransformOptions?.treeshake) === 'true'; // && !options.dev;
}
exports.isShakingEnabled = isShakingEnabled;
//# sourceMappingURL=treeShakeSerializerPlugin.js.map