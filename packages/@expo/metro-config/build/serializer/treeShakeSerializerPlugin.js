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
exports.isShakingEnabled = exports.accessAst = exports.printAst = exports.treeShakeSerializerPlugin = void 0;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const core_1 = require("@babel/core");
const babylon = __importStar(require("@babel/parser"));
const types = __importStar(require("@babel/types"));
const sideEffectsSerializerPlugin_1 = require("./sideEffectsSerializerPlugin");
const debug = require('debug')('expo:treeshaking');
const generate = require('@babel/generator').default;
const inspect = (...props) => console.log(...props.map((prop) => require('util').inspect(prop, { depth: 20, colors: true })));
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
                if (declaration.declarations) {
                    declaration.declarations.forEach((decl) => {
                        exportedIdentifiers.add(decl.id.name);
                    });
                }
                else {
                    exportedIdentifiers.add(declaration.id.name);
                }
            }
            specifiers.forEach((spec) => {
                exportedIdentifiers.add(spec.exported.name);
            });
        },
        ExportDefaultDeclaration(path) {
            // Default exports need to be handled separately
            // Assuming the default export is a function or class declaration:
            if (path.node.declaration.id) {
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
const annotate = false;
const optimizeAll = true;
function treeShakeSerializerPlugin(config) {
    return async function treeShakeSerializer(entryPoint, preModules, graph, options) {
        if (!isShakingEnabled(graph, options)) {
            return [entryPoint, preModules, graph, options];
        }
        const modules = [...graph.dependencies.values()];
        // Assign IDs to modules in a consistent order before changing anything.
        // This is because Metro defaults to a non-deterministic order.
        // We need to ensure a deterministic order before changing the graph, otherwise the output bundle will be corrupt.
        for (const module of modules) {
            options.createModuleId(module.path);
        }
        // console.log('treeshake:', graph.transformOptions);
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
                // console.log('has ast:', !!output.data.ast, output.data.code);
                output.data.ast ??= babylon.parse(output.data.code, { sourceType: 'unambiguous' });
                output.data.modules = {
                    imports: [],
                    exports: [],
                };
            });
        });
        // Useful for testing the transform reconciler...
        if (!optimizeAll) {
            return [entryPoint, preModules, graph, options];
        }
        // console.log('imports:', outputItem);
        // return [entryPoint, preModules, graph, options];
        function collectImportExports(value) {
            function getGraphId(moduleId) {
                const key = [...value.dependencies.values()].find((dep) => {
                    return dep.data.name === moduleId;
                })?.absolutePath;
                if (!key) {
                    throw new Error(`Failed to find graph key for import "${moduleId}" in module "${value.path}". Options: ${[...value.dependencies.values()].map((v) => v.data.name)}`);
                }
                return key;
            }
            for (const index in value.output) {
                const outputItem = value.output[index];
                const ast = accessAst(outputItem);
                (0, core_1.traverse)(ast, {
                    // Traverse and collect import/export statements.
                    ImportDeclaration(path) {
                        const source = path.node.source.value;
                        const specifiers = path.node.specifiers.map((specifier) => {
                            return {
                                type: specifier.type,
                                importedName: specifier.type === 'ImportSpecifier' ? specifier.imported.name : null,
                                localName: specifier.local.name,
                            };
                        });
                        outputItem.data.modules.imports.push({
                            source,
                            key: getGraphId(source),
                            specifiers,
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
                    // export from
                    ExportNamedDeclaration(path) {
                        if (path.node.source) {
                            const source = path.node.source.value;
                            const specifiers = path.node.specifiers.map((specifier) => {
                                return {
                                    type: specifier.type,
                                    exportedName: specifier.exported.name,
                                    localName: specifier.local.name,
                                };
                            });
                            outputItem.data.modules.imports.push({
                                source,
                                key: getGraphId(source),
                                specifiers,
                            });
                        }
                    },
                    // export * from
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
                // inspect('imports', outputItem.data.modules.imports);
            }
        }
        // const detectCommonJsExportsUsage = (ast: Parameters<typeof traverse>[0]): boolean => {
        //   let usesCommonJsExports = false;
        //   traverse(ast, {
        //     MemberExpression(path) {
        //       if (
        //         (path.node.object.name === 'module' && path.node.property.name === 'exports') ||
        //         path.node.object.name === 'exports'
        //       ) {
        //         usesCommonJsExports = true;
        //         console.log(`Found usage of ${path.node.object.name}.${path.node.property.name}`);
        //       }
        //     },
        //     CallExpression(path) {
        //       // Check for Object.assign or Object.defineProperties
        //       if (
        //         path.node.callee.type === 'MemberExpression' &&
        //         path.node.callee.object.name === 'Object' &&
        //         (path.node.callee.property.name === 'assign' ||
        //           path.node.callee.property.name === 'defineProperties')
        //       ) {
        //         // Check if the first argument is module.exports
        //         const firstArg = path.node.arguments[0];
        //         if (
        //           firstArg.type === 'MemberExpression' &&
        //           firstArg.object.name === 'module' &&
        //           firstArg.property.name === 'exports'
        //         ) {
        //           usesCommonJsExports = true;
        //         } else if (firstArg.type === 'Identifier' && firstArg.name === 'exports') {
        //           usesCommonJsExports = true;
        //         }
        //       }
        //     },
        //   });
        //   return usesCommonJsExports;
        // };
        function treeShakeExports(depId, value) {
            let dirtyImports = false;
            const inverseDeps = [...value.inverseDependencies.values()].map((id) => {
                return graph.dependencies.get(id);
            });
            const isExportUsed = (importName) => {
                return inverseDeps.some((dep) => {
                    return dep?.output.some((outputItem) => {
                        if (outputItem.type === 'js/module') {
                            const imports = outputItem.data.modules?.imports;
                            if (imports) {
                                return imports.some((importItem) => {
                                    if (importItem.key !== depId) {
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
                const ast = outputItem.data.ast;
                const markUnused = (path, node) => {
                    if (annotate) {
                        node.leadingComments = node.leadingComments ?? [];
                        if (!node.leadingComments.some((comment) => comment.value.includes('unused export'))) {
                            node.leadingComments.push({
                                type: 'CommentBlock',
                                value: ` unused export ${node.id.name} `,
                            });
                        }
                    }
                    else {
                        console.log('remove:', node.id?.name ?? node.exported?.name, 'from:', value.path);
                        path.remove();
                    }
                };
                // Collect a list of exports that are not used within the module.
                const possibleUnusedExports = getExportsThatAreNotUsedInModule(ast);
                const shouldPrintDebug = value.path.endsWith('/lucide-react.js');
                shouldPrintDebug && console.log('unusedExports', possibleUnusedExports, value.path);
                // Traverse exports and mark them as used or unused based on if inverse dependencies are importing them.
                (0, core_1.traverse)(ast, {
                    ExportDefaultDeclaration(path) {
                        if (possibleUnusedExports.includes('default') && !isExportUsed('default')) {
                            markUnused(path, path.node);
                        }
                    },
                    // Account for `export { foo as bar };`
                    ExportSpecifier(path) {
                        // Ensure the check isn't `export {} from '...'` since we handle that separately.
                        // if (path.parent.source) {
                        //   return;
                        // }
                        // Ensure the local node isn't used in the module.
                        if (types.isIdentifier(path.node.local)) {
                            const internalName = path.node.local.name;
                            if (types.isIdentifier(path.node.exported) &&
                                possibleUnusedExports.includes(path.node.exported.name) &&
                                !isExportUsed(path.node.exported.name)) {
                                shouldPrintDebug && console.log('check:', path.node.exported.name, internalName);
                                markUnused(path, path.node);
                            }
                        }
                    },
                    ExportNamedDeclaration(path) {
                        const declaration = path.node.declaration;
                        // shouldPrintDebug && console.log('BOYUUU', path.node);
                        // If empty, e.g. `export {} from '...'` then remove the whole statement.
                        if (!declaration) {
                            const importModuleId = path.node.source?.value;
                            if (importModuleId && path.node.specifiers.length === 0) {
                                if (disconnectGraphNode(value, importModuleId)) {
                                    console.log('ExportNamedDeclaration: Disconnected:', importModuleId, 'in:', value.path);
                                    // dirtyImports = true;
                                    // markUnused(path, path.node);
                                    path.remove();
                                }
                                else {
                                    console.log('ExportNamedDeclaration: Cannot remove graph node for: ', importModuleId, 'in:', value.path);
                                }
                            }
                            return;
                        }
                        if (declaration) {
                            // console.log('ExportNamedDeclaration: has dec: ', value.path);
                            if (declaration.type === 'VariableDeclaration') {
                                declaration.declarations.forEach((decl) => {
                                    if (decl.id.type === 'Identifier') {
                                        if (possibleUnusedExports.includes(decl.id.name) &&
                                            !isExportUsed(decl.id.name)) {
                                            markUnused(path, decl);
                                            console.log('mark remove.2:', decl.id.name, 'from:', value.path);
                                        }
                                    }
                                });
                            }
                            else {
                                // console.log(
                                //   'check:',
                                //   declaration.type,
                                //   declaration.id?.name,
                                //   isExportUsed(declaration.id.name),
                                //   unusedExports
                                // );
                                // if (declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration')
                                if (possibleUnusedExports.includes(declaration.id.name) &&
                                    !isExportUsed(declaration.id.name)) {
                                    console.log('mark remove:', declaration.id.name, 'from:', value.path);
                                    markUnused(path, declaration);
                                }
                            }
                        }
                    },
                });
            }
            return dirtyImports;
        }
        function disconnectGraphNode(graphModule, importModuleId) {
            // Unlink the module in the graph
            // The hash key for the dependency instance in the module.
            const depId = [...graphModule.dependencies.entries()].find(([key, dep]) => {
                return dep.data.name === importModuleId;
            })?.[0];
            // // Should never happen but we're playing with fire here.
            // if (!depId) {
            //   throw new Error(
            //     `Failed to find graph key for import "${importModuleId}" from "${importModuleId}" while optimizing ${
            //       value.path
            //     }. Options: ${[...value.dependencies.values()].map((v) => v.data.name)}`
            //   );
            // }
            // If the dependency was already removed, then we don't need to do anything.
            if (depId) {
                const importInstance = graphModule.dependencies.get(depId);
                // console.log('Try unlink:', importModuleId, dep);
                const graphEntryForTargetImport = graph.dependencies.get(importInstance.absolutePath);
                // Should never happen but we're playing with fire here.
                if (!graphEntryForTargetImport) {
                    throw new Error(`Failed to find graph key for re-export "${importModuleId}" while optimizing ${graphModule.path}. Options: ${[...graphModule.dependencies.values()].map((v) => v.data.name)}`);
                }
                const [isFx, trace] = (0, sideEffectsSerializerPlugin_1.hasSideEffectWithDebugTrace)(graph, graphEntryForTargetImport);
                // console.log('Drop', {
                //   depId,
                //   path: dep.absolutePath,
                //   fx: hasSideEffect(graph, graphDep),
                //   empty: isEmptyModule(graphDep),
                // });
                if (
                // Don't remove the module if it has side effects.
                !isFx ||
                    // Unless it's an empty module.
                    isEmptyModule(graphEntryForTargetImport)) {
                    console.log('Drop', {
                        depId,
                        path: importInstance.absolutePath,
                        fx: (0, sideEffectsSerializerPlugin_1.hasSideEffect)(graph, graphEntryForTargetImport),
                        empty: isEmptyModule(graphEntryForTargetImport),
                    });
                    // console.log('Drop module:', value.path);
                    // Remove inverse link to this dependency
                    graphEntryForTargetImport.inverseDependencies.delete(graphModule.path);
                    if (graphEntryForTargetImport.inverseDependencies.size === 0) {
                        // Remove the dependency from the graph as no other modules are using it anymore.
                        graph.dependencies.delete(importInstance.absolutePath);
                    }
                    // Remove a random instance of the dep count to track if there are multiple imports.
                    // TODO: Get the exact instance of the import.
                    importInstance.data.data.locs.pop();
                    if (!importInstance.data.data.locs.length) {
                        // Remove dependency from this module so it doesn't appear in the dependency map.
                        graphModule.dependencies.delete(depId);
                    }
                    // Mark the module as removed so we know to traverse again.
                    return true;
                }
                else {
                    if (isFx) {
                        console.log('Skip graph unlinking due to side-effect trace:', trace.join(' > '));
                    }
                    else {
                        console.log('Skip graph unlinking:', {
                            depId,
                            isFx,
                        });
                    }
                }
            }
            else {
                console.log('WARN: No graph dep ID for:', importModuleId, 'in:', graphModule.path);
            }
            return false;
        }
        function removeUnusedImports(value, ast) {
            // Traverse imports and remove unused imports.
            // Keep track of all the imported identifiers
            const importedIdentifiers = new Set();
            // Keep track of all used identifiers
            const usedIdentifiers = new Set();
            (0, core_1.traverse)(ast, {
                ImportSpecifier(path) {
                    importedIdentifiers.add(
                    // Support `import { foo as bar } from './foo'`
                    path.node.local.name ??
                        // Support `import { foo } from './foo'`
                        path.node.imported.name);
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
            });
            // Determine unused identifiers by subtracting the used from the imported
            const unusedImports = [...importedIdentifiers].filter((identifier) => !usedIdentifiers.has(identifier));
            // inspect(ast);
            let removed = false; //unusedImports.length > 0;
            // Remove the unused imports from the AST
            (0, core_1.traverse)(ast, {
                ImportDeclaration(path) {
                    const originalSize = path.node.specifiers.length;
                    path.node.specifiers = path.node.specifiers.filter((specifier) => {
                        if (specifier.type === 'ImportDefaultSpecifier') {
                            return !unusedImports.includes(specifier.local.name);
                        }
                        else if (specifier.type === 'ImportNamespaceSpecifier') {
                            return !unusedImports.includes(specifier.local.name);
                        }
                        else {
                            return !unusedImports.includes(specifier.imported.name);
                        }
                        // if (!specifier.imported) {
                        // }
                        // return !unusedImports.includes(specifier.imported.name);
                    });
                    if (originalSize !== path.node.specifiers.length) {
                        removed = true;
                    }
                    // If no specifiers are left after filtering, remove the whole import declaration
                    // e.g. `import './unused'` or `import {} from './unused'` -> remove.
                    if (path.node.specifiers.length === 0) {
                        // TODO: Ensure the module isn't side-effect-ful or importing a module that is side-effect-ful.
                        const importModuleId = path.node.source.value;
                        // Unlink the module in the graph
                        const depId = [...value.dependencies.entries()].find(([key, dep]) => {
                            return dep.data.name === importModuleId;
                        })?.[0];
                        // // Should never happen but we're playing with fire here.
                        // if (!depId) {
                        //   throw new Error(
                        //     `Failed to find graph key for import "${importModuleId}" from "${importModuleId}" while optimizing ${
                        //       value.path
                        //     }. Options: ${[...value.dependencies.values()].map((v) => v.data.name)}`
                        //   );
                        // }
                        // If the dependency was already removed, then we don't need to do anything.
                        if (depId) {
                            const dep = value.dependencies.get(depId);
                            const graphDep = graph.dependencies.get(dep.absolutePath);
                            // Should never happen but we're playing with fire here.
                            if (!graphDep) {
                                throw new Error(`Failed to find graph key for import "${importModuleId}" while optimizing ${value.path}. Options: ${[...value.dependencies.values()].map((v) => v.data.name)}`);
                            }
                            // console.log('Drop', {
                            //   depId,
                            //   path: dep.absolutePath,
                            //   fx: hasSideEffect(graph, graphDep),
                            //   empty: isEmptyModule(graphDep),
                            // });
                            if (
                            // Don't remove the module if it has side effects.
                            !(0, sideEffectsSerializerPlugin_1.hasSideEffect)(graph, graphDep) ||
                                // Unless it's an empty module.
                                isEmptyModule(graphDep)) {
                                console.log('Drop', {
                                    depId,
                                    path: dep.absolutePath,
                                    fx: (0, sideEffectsSerializerPlugin_1.hasSideEffect)(graph, graphDep),
                                    empty: isEmptyModule(graphDep),
                                });
                                // console.log('Drop module:', value.path);
                                // Remove inverse link to this dependency
                                graphDep.inverseDependencies.delete(value.path);
                                if (graphDep.inverseDependencies.size === 0) {
                                    // Remove the dependency from the graph as no other modules are using it anymore.
                                    graph.dependencies.delete(dep.absolutePath);
                                }
                                // Remove a random instance of the dep count to track if there are multiple imports.
                                dep.data.data.locs.pop();
                                if (!dep.data.data.locs.length) {
                                    // Remove dependency from this module in the graph
                                    value.dependencies.delete(depId);
                                }
                                // Delete the AST
                                path.remove();
                                // Mark the module as removed so we know to traverse again.
                                removed = true;
                            }
                        }
                        else {
                            // TODO: I'm not sure what to do here?
                            // Delete the AST
                            // path.remove();
                            // // Mark the module as removed so we know to traverse again.
                            // removed = true;
                        }
                    }
                },
            });
            return removed;
        }
        function isEmptyModule(value) {
            function isASTEmptyOrContainsOnlyCommentsAndUseStrict(ast) {
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
                            return;
                        }
                        // If it's an ExpressionStatement, check if it is "use strict"
                        if (node.type === 'ExpressionStatement' && node.expression) {
                            // Check if it's a Literal with value "use strict"
                            const expression = node.expression;
                            if (expression.type !== 'Literal' || expression.value !== 'use strict') {
                                isEmptyOrCommentsAndUseStrict = false;
                                path.stop(); // No need to traverse further
                            }
                        }
                    },
                    // If we encounter any non-comment nodes, it's not empty
                    noScope: true,
                });
                return isEmptyOrCommentsAndUseStrict;
            }
            return value.output.every((outputItem) => {
                return isASTEmptyOrContainsOnlyCommentsAndUseStrict(accessAst(outputItem));
            });
        }
        function treeShakeAll(depth = 0) {
            if (depth > 10) {
                return;
            }
            // This pass will parse all modules back to AST and include the import/export statements.
            for (const value of graph.dependencies.values()) {
                collectImportExports(value);
            }
            // TODO: Add special handling for circular dependencies.
            // This pass will annotate the AST with the used and unused exports.
            for (const [depId, value] of graph.dependencies.entries()) {
                // Remove loose exports in a module
                if (treeShakeExports(depId, value)) {
                    console.log('Re-run tree shake:', value.path);
                    // TODO: haha this is slow
                    return treeShakeAll(depth + 1);
                }
                value.output.forEach((outputItem) => {
                    const ast = accessAst(outputItem);
                    if (removeUnusedImports(value, ast)) {
                        // TODO: haha this is slow
                        treeShakeAll(depth + 1);
                    }
                });
            }
        }
        const beforeList = [...graph.dependencies.keys()];
        // Tree shake the graph.
        treeShakeAll();
        // Debug pass: Print all orphaned modules.
        for (const [depId, value] of graph.dependencies.entries()) {
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
                    console.log(`ERROR: All inverse dependencies are missing for: ${value.path}`);
                    // TODO: Make this not happen ever
                    graph.dependencies.delete(depId);
                }
                // // Find if a dep still depends on a file containing "esm/icons/zoom-in.js"
                // if (
                //   value.path.includes('esm/icons/zoom-in.js') ||
                //   value.path.includes('/esm/icons/index.js')
                // ) {
                //   console.log('Depends on zoom-in:', [...value.inverseDependencies.values()]);
                // }
            }
        }
        const afterList = [...graph.dependencies.keys()];
        // Print the removed modules:
        const removedModules = beforeList.filter((value) => !afterList.includes(value));
        console.log('Removed:', removedModules);
        return [entryPoint, preModules, graph, options];
    };
}
exports.treeShakeSerializerPlugin = treeShakeSerializerPlugin;
function printAst(ast) {
    console.log(generate(ast).code);
}
exports.printAst = printAst;
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