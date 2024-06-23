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
exports.createPostTreeShakeTransformSerializerPlugin = exports.isShakingEnabled = exports.treeShakeSerializerPlugin = void 0;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const core_1 = require("@babel/core");
const babylon = __importStar(require("@babel/parser"));
const types = __importStar(require("@babel/types"));
const assert_1 = __importDefault(require("assert"));
const collectDependencies_1 = require("metro/src/ModuleGraph/worker/collectDependencies");
const countLines_1 = __importDefault(require("metro/src/lib/countLines"));
const metro_source_map_1 = require("metro-source-map");
const metro_transform_plugins_1 = __importDefault(require("metro-transform-plugins"));
const sideEffectsSerializerPlugin_1 = require("./sideEffectsSerializerPlugin");
const generate = require('@babel/generator').default;
class InvalidRequireCallError extends Error {
    innerError;
    filename;
    constructor(innerError, filename) {
        super(`${filename}:${innerError.message}`);
        this.innerError = innerError;
        this.filename = filename;
    }
}
const JsFileWrapping = require('metro/src/ModuleGraph/worker/JsFileWrapping');
const collectDependencies = require('metro/src/ModuleGraph/worker/collectDependencies');
const generateImportNames = require('metro/src/ModuleGraph/worker/generateImportNames');
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
function treeShakeSerializerPlugin(config) {
    return async function treeShakeSerializer(entryPoint, preModules, graph, options) {
        if (!isShakingEnabled(graph, options)) {
            return [entryPoint, preModules, graph, options];
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
                console.log('unusedExports', possibleUnusedExports, value.path);
                const shouldPrintDebug = value.path === '/app/lucide.js';
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
                                // if (path.parent.source) {
                                //   const importModuleId = path.parent.source.value;
                                //   // TODO: Traverse multiple exports in the same statement before removing the `from "..."`
                                //   // if (disconnectGraphNode(importModuleId, value)) {
                                //   // dirtyImports = true;
                                //   // console.log('IMPORT:', importModuleId);
                                //   markUnused(path, path.node);
                                //   // }
                                //   return;
                                // } else {
                                markUnused(path, path.node);
                                // }
                                // disconnectGraphNode
                            }
                        }
                    },
                    ExportNamedDeclaration(path) {
                        const declaration = path.node.declaration;
                        shouldPrintDebug && console.log('BOYUUU', path.node);
                        // If empty, e.g. `export {} from '...'` then remove the whole statement.
                        if (!declaration) {
                            const importModuleId = path.node.source?.value;
                            if (importModuleId && path.node.specifiers.length === 0) {
                                if (disconnectGraphNode(importModuleId, value)) {
                                    // dirtyImports = true;
                                    console.log('IMPORT:', importModuleId);
                                    // markUnused(path, path.node);
                                    path.remove();
                                }
                            }
                            return;
                        }
                        if (declaration) {
                            if (declaration.type === 'VariableDeclaration') {
                                declaration.declarations.forEach((decl) => {
                                    if (decl.id.type === 'Identifier') {
                                        if (possibleUnusedExports.includes(decl.id.name) &&
                                            !isExportUsed(decl.id.name)) {
                                            markUnused(path, decl);
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
                                    markUnused(path, declaration);
                                }
                            }
                        }
                    },
                });
            }
            return dirtyImports;
        }
        function disconnectGraphNode(importModuleId, graphModule) {
            // Unlink the module in the graph
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
                const dep = graphModule.dependencies.get(depId);
                console.log('Unlink:', importModuleId, dep);
                const graphDep = graph.dependencies.get(dep.absolutePath);
                // Should never happen but we're playing with fire here.
                if (!graphDep) {
                    throw new Error(`Failed to find graph key for re-export "${importModuleId}" while optimizing ${graphModule.path}. Options: ${[...graphModule.dependencies.values()].map((v) => v.data.name)}`);
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
                    graphDep.inverseDependencies.delete(graphModule.path);
                    if (graphDep.inverseDependencies.size === 0) {
                        // Remove the dependency from the graph as no other modules are using it anymore.
                        graph.dependencies.delete(dep.absolutePath);
                    }
                    // Remove a random instance of the dep count to track if there are multiple imports.
                    dep.data.data.locs.pop();
                    if (!dep.data.data.locs.length) {
                        // Remove dependency from this module in the graph
                        graphModule.dependencies.delete(depId);
                    }
                    // Mark the module as removed so we know to traverse again.
                    return true;
                }
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
        // Tree shake the graph.
        treeShakeAll();
        return [entryPoint, preModules, graph, options];
    };
}
exports.treeShakeSerializerPlugin = treeShakeSerializerPlugin;
function accessAst(output) {
    // @ts-expect-error
    return output.data.ast;
}
function isShakingEnabled(graph, options) {
    return String(graph.transformOptions.customTransformOptions?.treeshake) === 'true'; // && !options.dev;
}
exports.isShakingEnabled = isShakingEnabled;
function assertCollectDependenciesOptions(collectDependenciesOptions) {
    if (!collectDependenciesOptions) {
        throw new Error('collectDependenciesOptions is required. Something is wrong with the metro transformer or transform cache.');
    }
    if (typeof collectDependenciesOptions !== 'object') {
        throw new Error('collectDependenciesOptions must be an object.');
    }
    (0, assert_1.default)('unstable_allowRequireContext' in collectDependenciesOptions, 'unstable_allowRequireContext is required.');
    (0, assert_1.default)('allowOptionalDependencies' in collectDependenciesOptions, 'allowOptionalDependencies is required.');
    (0, assert_1.default)('asyncRequireModulePath' in collectDependenciesOptions, 'asyncRequireModulePath is required.');
    (0, assert_1.default)('dynamicRequires' in collectDependenciesOptions, 'dynamicRequires is required.');
    (0, assert_1.default)('inlineableCalls' in collectDependenciesOptions, 'inlineableCalls is required.');
    (0, assert_1.default)('keepRequireNames' in collectDependenciesOptions, 'keepRequireNames is required.');
    (0, assert_1.default)('dependencyMapName' in collectDependenciesOptions, 'dependencyMapName is required.');
}
function createPostTreeShakeTransformSerializerPlugin(config) {
    return async function treeShakeSerializer(entryPoint, preModules, graph, options) {
        // console.log('treeshake:', graph.transformOptions, isShakingEnabled(graph, options));
        if (!isShakingEnabled(graph, options)) {
            return [entryPoint, preModules, graph, options];
        }
        // return [entryPoint, preModules, graph, options];
        // const includeDebugInfo = false;
        const preserveEsm = false;
        // TODO: When we can reuse transformJS for JSON, we should not derive `minify` separately.
        const minify = graph.transformOptions.minify &&
            graph.transformOptions.unstable_transformProfile !== 'hermes-canary' &&
            graph.transformOptions.unstable_transformProfile !== 'hermes-stable';
        // const dynamicTransformOptions = await config.transformer?.getTransformOptions?.(
        //   [entryPoint],
        //   {
        //     dev: options.dev,
        //     hot: false,
        //     platform: graph.transformOptions.platform,
        //   },
        //   async (filepath) => {
        //     return [...(graph.dependencies.get(filepath)?.dependencies.keys() ?? [])];
        //   }
        // );
        // Convert all remaining AST and dependencies to standard output that Metro expects.
        // This is normally done in the transformer, but we skipped it so we could perform graph analysis (tree-shake).
        for (const value of graph.dependencies.values()) {
            // if (value.path.includes('empty-module.js')) {
            //   inspect(value);
            // }
            for (const index in value.output) {
                const outputItem = value.output[index];
                if (outputItem.type !== 'js/module' || value.path.endsWith('.json')) {
                    debug('Skipping post transform for non-js/module: ' + value.path);
                    continue;
                }
                // This should be cached by the transform worker for use here to ensure close to consistent
                // results between the tree-shake and the final transform.
                const collectDependenciesOptions = outputItem.data.collectDependenciesOptions;
                assertCollectDependenciesOptions(collectDependenciesOptions);
                // if (!collectDependenciesOptions) {
                //   debug('Skipping post transform for module: ' + value.path);
                //   continue;
                // }
                let ast = accessAst(outputItem);
                if (!ast) {
                    continue;
                }
                console.log(require('@babel/generator').default(ast).code);
                // NOTE: ^^ Only modules are being parsed to ast right now.
                delete outputItem.data.ast;
                // console.log('treeshake!!:', value.path, outputItem.data.collectDependenciesOptions);
                const importDefault = collectDependenciesOptions.inlineableCalls[0];
                const importAll = collectDependenciesOptions.inlineableCalls[1];
                // const { importDefault, importAll } = generateImportNames(ast);
                const babelPluginOpts = {
                    // ...options,
                    ...graph.transformOptions,
                    // inlinePlatform: true,
                    // minify: false,
                    // platform: 'web',
                    // unstable_transformProfile: 'default',
                    // experimentalImportSupport: false,
                    // unstable_disableES6Transforms: false,
                    // nonInlinedRequires: [ 'React', 'react', 'react-native' ],
                    // type: 'module',
                    // inlineRequires: false,
                    inlineableCalls: [importDefault, importAll],
                    importDefault,
                    importAll,
                };
                ast = (0, core_1.transformFromAstSync)(ast, undefined, {
                    ast: true,
                    babelrc: false,
                    code: false,
                    configFile: false,
                    // comments: includeDebugInfo,
                    // compact: false,
                    filename: value.path,
                    plugins: [
                        // functionMapBabelPlugin,
                        !preserveEsm && [metro_transform_plugins_1.default.importExportPlugin, babelPluginOpts],
                        // TODO: Inline requires matchers
                        // dynamicTransformOptions?.transform?.inlineRequires && [
                        //   require('metro-transform-plugins/src/inline-plugin'),
                        //   babelPluginOpts,
                        // ],
                    ].filter(Boolean),
                    sourceMaps: false,
                    // // Not-Cloning the input AST here should be safe because other code paths above this call
                    // // are mutating the AST as well and no code is depending on the original AST.
                    // // However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
                    // // either because one of the plugins is doing something funky or Babel messes up some caches.
                    // // Make sure to test the above mentioned case before flipping the flag back to false.
                    // cloneInputAst: true,
                })?.ast;
                // TODO: Test a JSON, asset, and script-type module from the transformer since they have different handling.
                let dependencyMapName = '';
                // This pass converts the modules to use the generated import names.
                try {
                    const opts = collectDependenciesOptions;
                    // TODO: Maybe we should try to reconcile missing props here...
                    //  {
                    //   asyncRequireModulePath:
                    //     config.transformer?.asyncRequireModulePath ??
                    //     require.resolve('metro-runtime/src/modules/asyncRequire'),
                    //   dependencyTransformer: undefined,
                    //   dynamicRequires: getDynamicDepsBehavior(
                    //     config.transformer?.dynamicDepsInPackages ?? 'throwAtRuntime',
                    //     value.path
                    //   ),
                    //   inlineableCalls: [importDefault, importAll],
                    //   keepRequireNames: options.dev,
                    //   // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L132C32-L132C37
                    //   allowOptionalDependencies: config.transformer?.allowOptionalDependencies ?? false,
                    //   // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L134C46-L134C46
                    //   dependencyMapName: config.transformer?.unstable_dependencyMapReservedName ?? null,
                    //   // Expo sets this to `true`.
                    //   unstable_allowRequireContext: config.transformer?.unstable_allowRequireContext,
                    // };
                    // TODO: We should try to drop this black-box approach since we don't need the deps.
                    // We just need the AST modifications such as `require.context`.
                    // console.log(require('@babel/generator').default(ast).code);
                    ({ ast, dependencyMapName } = collectDependencies(ast, {
                        ...opts,
                        // This setting shouldn't be shared + it can't be serialized and cached anyways.
                        dependencyTransformer: null,
                    }));
                }
                catch (error) {
                    if (error instanceof collectDependencies_1.InvalidRequireCallError) {
                        throw new InvalidRequireCallError(error, value.path);
                    }
                    throw error;
                }
                // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L107
                const globalPrefix = config.transformer?.globalPrefix ?? '';
                const { ast: wrappedAst } = JsFileWrapping.wrapModule(ast, importDefault, importAll, dependencyMapName, 
                // TODO: Share these with transformer
                globalPrefix, config.transformer?.unstable_renameRequire === false);
                const source = value.getSource().toString('utf-8');
                const reserved = [];
                if (config.transformer?.unstable_dependencyMapReservedName != null) {
                    reserved.push(config.transformer.unstable_dependencyMapReservedName);
                }
                // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L128C28-L128C38
                const optimizationSizeLimit = config.transformer?.optimizationSizeLimit ?? 150 * 1024;
                if (minify &&
                    source.length <= optimizationSizeLimit &&
                    !config.transformer?.unstable_disableNormalizePseudoGlobals) {
                    // This MUST run before `generate` as it mutates the ast out of place.
                    reserved.push(...metro_transform_plugins_1.default.normalizePseudoGlobals(wrappedAst, {
                        reservedNames: reserved,
                    }));
                }
                const result = generate(wrappedAst, {
                    // comments: true,
                    // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L137
                    compact: config.transformer?.unstable_compactOutput ?? false,
                    filename: value.path,
                    retainLines: false,
                    sourceFileName: value.path,
                    sourceMaps: true,
                }, outputItem.data.code);
                let map = result.rawMappings ? result.rawMappings.map(metro_source_map_1.toSegmentTuple) : [];
                let code = result.code;
                if (minify && !preserveEsm) {
                    ({ map, code } = await minifyCode(config.transformer ?? {}, config.projectRoot, value.path, result.code, source, map, reserved));
                    // console.log('module', code);
                }
                outputItem.data = {
                    ...outputItem.data,
                    code,
                    map,
                    lineCount: (0, countLines_1.default)(code),
                    functionMap: 
                    // @ts-expect-error: https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-transform-worker/src/index.js#L508-L512
                    ast.metadata?.metro?.functionMap ??
                        // @ts-expect-error: Fallback to deprecated explicitly-generated `functionMap`
                        ast.functionMap ??
                        null,
                };
            }
        }
        return [entryPoint, preModules, graph, options];
    };
}
exports.createPostTreeShakeTransformSerializerPlugin = createPostTreeShakeTransformSerializerPlugin;
const debug = require('debug')('expo:treeshaking');
const getMinifier = require('metro-transform-worker/src/utils/getMinifier');
// TODO: Rework all of this to share logic with the transformer. Also account for not minifying in hermes bundles.
async function minifyCode(config, projectRoot, filename, code, source, map, reserved = []) {
    const sourceMap = (0, metro_source_map_1.fromRawMappings)([
        {
            code,
            source,
            map,
            // functionMap is overridden by the serializer
            functionMap: null,
            path: filename,
            // isIgnored is overriden by the serializer
            isIgnored: false,
        },
    ]).toMap(undefined, {});
    // https://github.com/facebook/metro/blob/d1b0015d5a41ad1a1e1e78661805b692c34457db/packages/metro-config/src/defaults/defaults.js#L66
    const minify = getMinifier(config.minifierPath ?? 'metro-minify-terser');
    try {
        // console.log('reserved', reserved, code);
        const minified = await minify({
            code,
            map: sourceMap,
            filename,
            reserved,
            // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L109-L126
            config: config.minifierConfig ?? {
                mangle: {
                    toplevel: false,
                },
                output: {
                    ascii_only: true,
                    quote_style: 3,
                    wrap_iife: true,
                },
                sourceMap: {
                    includeSources: false,
                },
                toplevel: false,
                compress: {
                    // reduce_funcs inlines single-use functions, which cause perf regressions.
                    reduce_funcs: false,
                },
            },
        });
        return {
            code: minified.code,
            map: minified.map ? (0, metro_source_map_1.toBabelSegments)(minified.map).map(metro_source_map_1.toSegmentTuple) : [],
        };
    }
    catch (error) {
        if (error.constructor.name === 'JS_Parse_Error') {
            throw new Error(`${error.message} in file ${filename} at ${error.line}:${error.col}`);
        }
        throw error;
    }
}
//# sourceMappingURL=treeShakeSerializerPlugin.js.map