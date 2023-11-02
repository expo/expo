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
exports.createSerializerFromSerialProcessors = exports.getDefaultSerializer = exports.treeShakeSerializerPlugin = exports.withSerializerPlugins = exports.withExpoSerializers = void 0;
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const core_1 = require("@babel/core");
const babylon = __importStar(require("@babel/parser"));
const fs_1 = __importDefault(require("fs"));
const jsc_safe_url_1 = require("jsc-safe-url");
const baseJSBundle_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/baseJSBundle"));
// @ts-expect-error
const sourceMapString_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/sourceMapString"));
const bundleToString_1 = __importDefault(require("metro/src/lib/bundleToString"));
const metro_source_map_1 = require("metro-source-map");
const minimatch_1 = __importDefault(require("minimatch"));
const path_1 = __importDefault(require("path"));
const environmentVariableSerializerPlugin_1 = require("./environmentVariableSerializerPlugin");
const getCssDeps_1 = require("./getCssDeps");
const env_1 = require("../env");
const countLines = require('metro/src/lib/countLines');
function withExpoSerializers(config) {
    const processors = [];
    processors.push(environmentVariableSerializerPlugin_1.serverPreludeSerializerPlugin);
    if (!env_1.env.EXPO_NO_CLIENT_ENV_VARS) {
        processors.push(environmentVariableSerializerPlugin_1.environmentVariableSerializerPlugin);
    }
    processors.push(treeShakeSerializerPlugin(config));
    return withSerializerPlugins(config, processors);
}
exports.withExpoSerializers = withExpoSerializers;
// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
function withSerializerPlugins(config, processors) {
    const originalSerializer = config.serializer?.customSerializer;
    return {
        ...config,
        serializer: {
            ...config.serializer,
            customSerializer: createSerializerFromSerialProcessors(processors, originalSerializer),
        },
    };
}
exports.withSerializerPlugins = withSerializerPlugins;
const JsFileWrapping = require('metro/src/ModuleGraph/worker/JsFileWrapping');
const generateImportNames = require('metro/src/ModuleGraph/worker/generateImportNames');
const inspect = (...props) => console.log(...props.map((prop) => require('util').inspect(prop, { depth: 20, colors: true })));
function treeShakeSerializerPlugin(config) {
    return async function treeShakeSerializer(entryPoint, preModules, graph, options) {
        // console.log('treeshake:', graph.transformOptions);
        if (graph.transformOptions.customTransformOptions?.treeshake !== 'true' || options.dev) {
            return [entryPoint, preModules, graph, options];
        }
        const includeDebugInfo = false;
        const preserveEsm = false;
        // TODO: When we can reuse transformJS for JSON, we should not derive `minify` separately.
        const minify = graph.transformOptions.minify &&
            graph.transformOptions.unstable_transformProfile !== 'hermes-canary' &&
            graph.transformOptions.unstable_transformProfile !== 'hermes-stable';
        // Collect a list of exports that are not used within the module.
        function findUnusedExports(ast) {
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
                        usedIdentifiers.add(path.node.name);
                    }
                },
            });
            // Determine which exports are unused
            exportedIdentifiers.forEach((exported) => {
                if (!usedIdentifiers.has(exported)) {
                    unusedExports.push(exported);
                }
            });
            return unusedExports;
        }
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
                const ast = outputItem.data.ast ?? babylon.parse(outputItem.data.code, { sourceType: 'unambiguous' });
                outputItem.data.ast = ast;
                outputItem.data.modules = {
                    imports: [],
                    exports: [],
                };
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
                                    if (importItem.cjs || importItem.star) {
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
                const annotate = false;
                function markUnused(path, node) {
                    if (annotate) {
                        node.leadingComments = node.leadingComments ?? [];
                        node.leadingComments.push({
                            type: 'CommentBlock',
                            value: ` unused export ${node.id.name} `,
                        });
                    }
                    else {
                        path.remove();
                    }
                }
                // Collect a list of exports that are not used within the module.
                const unusedExports = findUnusedExports(ast);
                // Traverse exports and mark them as used or unused based on if inverse dependencies are importing them.
                (0, core_1.traverse)(ast, {
                    ExportDefaultDeclaration(path) {
                        if (unusedExports.includes('default') && !isExportUsed('default')) {
                            markUnused(path, path.node);
                        }
                    },
                    ExportNamedDeclaration(path) {
                        const declaration = path.node.declaration;
                        if (declaration) {
                            if (declaration.type === 'VariableDeclaration') {
                                declaration.declarations.forEach((decl) => {
                                    if (decl.id.type === 'Identifier') {
                                        if (unusedExports.includes(decl.id.name) && !isExportUsed(decl.id.name)) {
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
                                if (unusedExports.includes(declaration.id.name) &&
                                    !isExportUsed(declaration.id.name)) {
                                    markUnused(path, declaration);
                                }
                            }
                        }
                    },
                });
            }
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
                            // inspect(
                            //   'remove',
                            //   depId,
                            //   dep.absolutePath,
                            //   hasSideEffect(graphDep),
                            //   isEmptyModule(graphDep)
                            // );
                            if (
                            // Don't remove the module if it has side effects.
                            !hasSideEffect(graphDep) ||
                                // Unless it's an empty module.
                                isEmptyModule(graphDep)) {
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
                if (!ast.program.body.length) {
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
                const ast = outputItem.data.ast;
                return isASTEmptyOrContainsOnlyCommentsAndUseStrict(ast);
            });
        }
        function hasSideEffect(value, checked = new Set()) {
            if (value.sideEffects) {
                return true;
            }
            // Recursively check if any of the dependencies have side effects.
            for (const depReference of value.dependencies.values()) {
                if (checked.has(depReference.absolutePath)) {
                    continue;
                }
                checked.add(depReference.absolutePath);
                const dep = graph.dependencies.get(depReference.absolutePath);
                if (hasSideEffect(dep, checked)) {
                    return true;
                }
            }
            return false;
        }
        function treeShakeAll(depth = 0) {
            if (depth > 10) {
                return;
            }
            // This pass will parse all modules back to AST and include the import/export statements.
            for (const value of graph.dependencies.values()) {
                collectImportExports(value);
            }
            // This pass will annotate the AST with the used and unused exports.
            for (const [depId, value] of graph.dependencies.entries()) {
                treeShakeExports(depId, value);
                value.output.forEach((outputItem) => {
                    const ast = outputItem.data.ast;
                    if (removeUnusedImports(value, ast)) {
                        // TODO: haha this is slow
                        treeShakeAll(depth + 1);
                    }
                });
            }
        }
        function markSideEffects() {
            const findUpPackageJsonPath = (dir) => {
                if (dir === path_1.default.sep || dir.length < options.projectRoot.length) {
                    return null;
                }
                const packageJsonPath = path_1.default.join(dir, 'package.json');
                if (fs_1.default.existsSync(packageJsonPath)) {
                    return packageJsonPath;
                }
                return findUpPackageJsonPath(path_1.default.dirname(dir));
            };
            const pkgJsonCache = new Map();
            const getPackageJsonMatcher = (dir) => {
                const cached = pkgJsonCache.get(dir);
                if (cached) {
                    return cached;
                }
                const packageJsonPath = findUpPackageJsonPath(dir);
                if (!packageJsonPath) {
                    return null;
                }
                const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf-8'));
                // TODO: Split out and unit test.
                const dirRoot = path_1.default.dirname(packageJsonPath);
                const isSideEffect = (fp) => {
                    // Default is that everything is a side-effect unless explicitly marked as not.
                    if (packageJson.sideEffects == null) {
                        return true;
                    }
                    if (typeof packageJson.sideEffects === 'boolean') {
                        return packageJson.sideEffects;
                    }
                    else if (Array.isArray(packageJson.sideEffects)) {
                        const relativeName = path_1.default.relative(dirRoot, fp);
                        return packageJson.sideEffects.some((sideEffect) => {
                            if (typeof sideEffect === 'string') {
                                return (0, minimatch_1.default)(relativeName, sideEffect.replace(/^\.\//, ''), {
                                    matchBase: true,
                                });
                            }
                            return false;
                        });
                    }
                    return false;
                };
                pkgJsonCache.set(dir, isSideEffect);
                return isSideEffect;
            };
            // This pass will traverse all dependencies and mark them as side-effect-ful if they are marked as such
            // in the package.json, according to Webpack: https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free
            for (const value of graph.dependencies.values()) {
                const isSideEffect = getPackageJsonMatcher(value.path);
                if (!isSideEffect) {
                    continue;
                }
                // @ts-expect-error: Not on type. This logic should probably be upstreamed.
                value.sideEffects = isSideEffect(value.path);
            }
            // This pass will surface all recursive dependencies that are side-effect-ful and mark them early
            // so we aren't redoing recursive checks later.
            // e.g. `./index.js` -> `./foo.js` -> `./bar.js` -> `./baz.js` (side-effect)
            // All modules will be marked as side-effect-ful.
            for (const value of graph.dependencies.values()) {
                if (hasSideEffect(value)) {
                    value.sideEffects = true;
                }
            }
        }
        // Iterate the graph and mark dependencies as side-effect-ful if they are marked as such in the package.json.
        markSideEffects();
        // Tree shake the graph.
        treeShakeAll();
        // Convert all remaining AST and dependencies to standard output that Metro expects.
        // This is normally done in the transformer, but we skipped it so we could perform graph analysis (tree-shake).
        for (const value of graph.dependencies.values()) {
            // console.log('inverseDependencies', value.inverseDependencies.values());
            for (const index in value.output) {
                const outputItem = value.output[index];
                // inspect('ii', outputItem.data.modules.imports);
                // let ast = outputItem.data.ast!;
                let ast = outputItem.data.ast; //?? babylon.parse(outputItem.data.code, { sourceType: 'unambiguous' });
                const { importDefault, importAll } = generateImportNames(ast);
                const babelPluginOpts = {
                    // ...options,
                    inlineableCalls: [importDefault, importAll],
                    importDefault,
                    importAll,
                };
                ast = (0, core_1.transformFromAstSync)(ast, undefined, {
                    ast: true,
                    babelrc: false,
                    code: false,
                    configFile: false,
                    comments: includeDebugInfo,
                    compact: false,
                    filename: value.path,
                    plugins: [
                        metro_source_map_1.functionMapBabelPlugin,
                        !preserveEsm && [
                            require('metro-transform-plugins/src/import-export-plugin'),
                            babelPluginOpts,
                        ],
                        !preserveEsm && [require('metro-transform-plugins/src/inline-plugin'), babelPluginOpts],
                    ].filter(Boolean),
                    sourceMaps: false,
                    // Not-Cloning the input AST here should be safe because other code paths above this call
                    // are mutating the AST as well and no code is depending on the original AST.
                    // However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
                    // either because one of the plugins is doing something funky or Babel messes up some caches.
                    // Make sure to test the above mentioned case before flipping the flag back to false.
                    cloneInputAst: true,
                })?.ast;
                let dependencyMapName = '';
                // This pass converts the modules to use the generated import names.
                try {
                    const opts = {
                        asyncRequireModulePath: config.transformer?.asyncRequireModulePath ??
                            require.resolve('metro-runtime/src/modules/asyncRequire'),
                        dependencyTransformer: undefined,
                        dynamicRequires: getDynamicDepsBehavior(config.transformer?.dynamicDepsInPackages ?? 'reject', value.path),
                        inlineableCalls: [importDefault, importAll],
                        keepRequireNames: options.dev,
                        allowOptionalDependencies: config.transformer?.allowOptionalDependencies ?? true,
                        dependencyMapName: config.transformer?.unstable_dependencyMapReservedName,
                        unstable_allowRequireContext: config.transformer?.unstable_allowRequireContext,
                    };
                    ({ ast, dependencyMapName } = collectDependencies(ast, opts));
                    // ({ ast, dependencies, dependencyMapName } = collectDependencies(ast, opts));
                }
                catch (error) {
                    // if (error instanceof InternalInvalidRequireCallError) {
                    //   throw new InvalidRequireCallError(error, file.filename);
                    // }
                    throw error;
                }
                const globalPrefix = '';
                const { ast: wrappedAst } = JsFileWrapping.wrapModule(ast, importDefault, importAll, dependencyMapName, globalPrefix);
                const outputCode = (0, core_1.transformFromAstSync)(wrappedAst, undefined, {
                    ast: false,
                    babelrc: false,
                    code: true,
                    configFile: false,
                    // comments: true,
                    // compact: false,
                    comments: includeDebugInfo,
                    compact: !includeDebugInfo,
                    filename: value.path,
                    plugins: [],
                    sourceMaps: false,
                    // Not-Cloning the input AST here should be safe because other code paths above this call
                    // are mutating the AST as well and no code is depending on the original AST.
                    // However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
                    // either because one of the plugins is doing something funky or Babel messes up some caches.
                    // Make sure to test the above mentioned case before flipping the flag back to false.
                    cloneInputAst: true,
                }).code;
                let map = [];
                let code = outputCode;
                if (minify && !preserveEsm) {
                    const minifyCode = require('metro-minify-terser');
                    try {
                        ({ map, code } = await minifyCode({
                            //           code: string;
                            // map?: BasicSourceMap;
                            // filename: string;
                            // reserved: ReadonlyArray<string>;
                            // config: MinifierConfig;
                            // projectRoot,
                            filename: value.path,
                            code,
                            // file.code,
                            // map,
                            config: {},
                            reserved: [],
                            // config,
                        }));
                    }
                    catch (error) {
                        console.error('Error minifying: ' + value.path);
                        console.error(code);
                        throw error;
                    }
                }
                outputItem.data.code = (includeDebugInfo ? `\n// ${value.path}\n` : '') + code;
                outputItem.data.lineCount = countLines(outputItem.data.code);
                outputItem.data.map = map;
                outputItem.data.functionMap =
                    ast.metadata?.metro?.functionMap ??
                        // Fallback to deprecated explicitly-generated `functionMap`
                        ast.functionMap ??
                        null;
                // TODO: minify the code to fold anything that was dropped above.
                // console.log('output code', outputItem.data.code);
            }
        }
        return [entryPoint, preModules, graph, options];
    };
}
exports.treeShakeSerializerPlugin = treeShakeSerializerPlugin;
function getDefaultSerializer(fallbackSerializer) {
    const defaultSerializer = fallbackSerializer ??
        (async (...params) => {
            const bundle = (0, baseJSBundle_1.default)(...params);
            const outputCode = (0, bundleToString_1.default)(bundle).code;
            return outputCode;
        });
    return async (...props) => {
        const [entryPoint, preModules, graph, options] = props;
        // if (process.env.NODE_ENV !== 'test') toFixture(...props);
        const jsCode = await defaultSerializer(entryPoint, preModules, graph, options);
        // console.log('OUTPUT CODE', jsCode);
        if (!options.sourceUrl) {
            return jsCode;
        }
        const sourceUrl = (0, jsc_safe_url_1.isJscSafeUrl)(options.sourceUrl)
            ? (0, jsc_safe_url_1.toNormalUrl)(options.sourceUrl)
            : options.sourceUrl;
        const url = new URL(sourceUrl, 'https://expo.dev');
        if (url.searchParams.get('platform') !== 'web' ||
            url.searchParams.get('serializer.output') !== 'static') {
            // Default behavior if `serializer.output=static` is not present in the URL.
            return jsCode;
        }
        const includeSourceMaps = url.searchParams.get('serializer.map') === 'true';
        const cssDeps = (0, getCssDeps_1.getCssSerialAssets)(graph.dependencies, {
            projectRoot: options.projectRoot,
            processModuleFilter: options.processModuleFilter,
        });
        const jsAssets = [];
        if (jsCode) {
            const stringContents = typeof jsCode === 'string' ? jsCode : jsCode.code;
            const jsFilename = (0, getCssDeps_1.fileNameFromContents)({
                filepath: url.pathname,
                src: stringContents,
            });
            jsAssets.push({
                filename: options.dev ? 'index.js' : `_expo/static/js/web/${jsFilename}.js`,
                originFilename: 'index.js',
                type: 'js',
                metadata: {},
                source: stringContents,
            });
            if (
            // Only include the source map if the `options.sourceMapUrl` option is provided and we are exporting a static build.
            includeSourceMaps &&
                options.sourceMapUrl) {
                const sourceMap = typeof jsCode === 'string' ? serializeToSourceMap(...props) : jsCode.map;
                // Make all paths relative to the server root to prevent the entire user filesystem from being exposed.
                const parsed = JSON.parse(sourceMap);
                // TODO: Maybe we can do this earlier.
                parsed.sources = parsed.sources.map(
                // TODO: Maybe basePath support
                (value) => {
                    if (value.startsWith('/')) {
                        return '/' + path_1.default.relative(options.serverRoot ?? options.projectRoot, value);
                    }
                    // Prevent `__prelude__` from being relative.
                    return value;
                });
                jsAssets.push({
                    filename: options.dev ? 'index.map' : `_expo/static/js/web/${jsFilename}.js.map`,
                    originFilename: 'index.map',
                    type: 'map',
                    metadata: {},
                    source: JSON.stringify(parsed),
                });
            }
        }
        return JSON.stringify([...jsAssets, ...cssDeps]);
    };
}
exports.getDefaultSerializer = getDefaultSerializer;
function getSortedModules(graph, { createModuleId, }) {
    const modules = [...graph.dependencies.values()];
    // Assign IDs to modules in a consistent order
    for (const module of modules) {
        createModuleId(module.path);
    }
    // Sort by IDs
    return modules.sort((a, b) => createModuleId(a.path) - createModuleId(b.path));
}
function serializeToSourceMap(...props) {
    const [, prepend, graph, options] = props;
    const modules = [
        ...prepend,
        ...getSortedModules(graph, {
            createModuleId: options.createModuleId,
        }),
    ];
    return (0, sourceMapString_1.default)(modules, {
        ...options,
    });
}
function createSerializerFromSerialProcessors(processors, originalSerializer) {
    const finalSerializer = getDefaultSerializer(originalSerializer);
    return async (...props) => {
        // toFixture(...props);
        for (const processor of processors) {
            if (processor) {
                props = await processor(...props);
            }
        }
        return finalSerializer(...props);
    };
}
exports.createSerializerFromSerialProcessors = createSerializerFromSerialProcessors;
function getDynamicDepsBehavior(inPackages, filename) {
    switch (inPackages) {
        case 'reject':
            return 'reject';
        case 'throwAtRuntime':
            const isPackage = /(?:^|[/\\])node_modules[/\\]/.test(filename);
            return isPackage ? inPackages : 'reject';
        default:
            throw new Error(`invalid value for dynamic deps behavior: \`${inPackages}\``);
    }
}
const collectDependencies = require('metro/src/ModuleGraph/worker/collectDependencies');
