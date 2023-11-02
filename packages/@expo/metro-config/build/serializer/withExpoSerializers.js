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
const jsc_safe_url_1 = require("jsc-safe-url");
const baseJSBundle_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/baseJSBundle"));
// @ts-expect-error
const sourceMapString_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/sourceMapString"));
const bundleToString_1 = __importDefault(require("metro/src/lib/bundleToString"));
const path_1 = __importDefault(require("path"));
const environmentVariableSerializerPlugin_1 = require("./environmentVariableSerializerPlugin");
const getCssDeps_1 = require("./getCssDeps");
const env_1 = require("../env");
const countLines = require('metro/src/lib/countLines');
const metro_source_map_1 = require("metro-source-map");
const babylon = __importStar(require("@babel/parser"));
function withExpoSerializers(config) {
    const processors = [];
    processors.push(environmentVariableSerializerPlugin_1.serverPreludeSerializerPlugin);
    if (!env_1.env.EXPO_NO_CLIENT_ENV_VARS) {
        processors.push(environmentVariableSerializerPlugin_1.environmentVariableSerializerPlugin);
    }
    if (env_1.env.EXPO_USE_TREE_SHAKING) {
        processors.push(treeShakeSerializerPlugin);
    }
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
function treeShakeSerializerPlugin(entryPoint, preModules, graph, options) {
    const includeDebugInfo = false;
    const preserveEsm = false;
    // TODO: When we can reuse transformJS for JSON, we should not derive `minify` separately.
    const minify = graph.transformOptions.minify &&
        graph.transformOptions.unstable_transformProfile !== 'hermes-canary' &&
        graph.transformOptions.unstable_transformProfile !== 'hermes-stable';
    function collectImportExports(value) {
        function getGraphId(moduleId) {
            const key = [...value.dependencies.values()].find((dep) => {
                return dep.data.name === moduleId;
            })?.absolutePath;
            if (!key) {
                throw new Error(`Failed to find graph key for import "${moduleId}" in module "${value.path}"`);
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
            });
        }
    }
    const detectCommonJsExportsUsage = (ast) => {
        let usesCommonJsExports = false;
        (0, core_1.traverse)(ast, {
            MemberExpression(path) {
                if ((path.node.object.name === 'module' && path.node.property.name === 'exports') ||
                    path.node.object.name === 'exports') {
                    usesCommonJsExports = true;
                    console.log(`Found usage of ${path.node.object.name}.${path.node.property.name}`);
                }
            },
            CallExpression(path) {
                // Check for Object.assign or Object.defineProperties
                if (path.node.callee.type === 'MemberExpression' &&
                    path.node.callee.object.name === 'Object' &&
                    (path.node.callee.property.name === 'assign' ||
                        path.node.callee.property.name === 'defineProperties')) {
                    // Check if the first argument is module.exports
                    const firstArg = path.node.arguments[0];
                    if (firstArg.type === 'MemberExpression' &&
                        firstArg.object.name === 'module' &&
                        firstArg.property.name === 'exports') {
                        usesCommonJsExports = true;
                    }
                    else if (firstArg.type === 'Identifier' && firstArg.name === 'exports') {
                        usesCommonJsExports = true;
                    }
                }
            },
        });
        return usesCommonJsExports;
    };
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
                                return (importItem.key === depId &&
                                    // If the import is CommonJS, then we can't tree-shake it.
                                    (importItem.cjs ||
                                        importItem.specifiers.some((specifier) => {
                                            return specifier.importedName === importName;
                                        })));
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
            const remainingExports = new Set();
            // Traverse exports and mark them as used or unused based on if inverse dependencies are importing them.
            (0, core_1.traverse)(ast, {
                ExportDefaultDeclaration(path) {
                    if (!isExportUsed('default')) {
                        markUnused(path, path.node);
                    }
                    else {
                        remainingExports.add('default');
                    }
                },
                ExportNamedDeclaration(path) {
                    const declaration = path.node.declaration;
                    if (declaration) {
                        if (declaration.type === 'VariableDeclaration') {
                            declaration.declarations.forEach((decl) => {
                                if (decl.id.type === 'Identifier') {
                                    if (!isExportUsed(decl.id.name)) {
                                        markUnused(path, decl);
                                    }
                                    else {
                                        remainingExports.add(decl.id.name);
                                    }
                                }
                            });
                        }
                        else {
                            // if (declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration')
                            if (!isExportUsed(declaration.id.name)) {
                                markUnused(path, declaration);
                            }
                            else {
                                remainingExports.add(declaration.id.name);
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
                importedIdentifiers.add(path.node.imported.name);
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
        // console.log('usedIdentifiers', unusedImports, usedIdentifiers);
        let removed = unusedImports.length > 0;
        // Remove the unused imports from the AST
        (0, core_1.traverse)(ast, {
            ImportDeclaration(path) {
                path.node.specifiers = path.node.specifiers.filter((specifier) => {
                    return !unusedImports.includes(specifier.imported.name);
                });
                // If no specifiers are left after filtering, remove the whole import declaration
                // e.g. `import './unused'` or `import {} from './unused'` -> remove.
                if (path.node.specifiers.length === 0) {
                    // TODO: Ensure the module isn't side-effect-ful or importing a module that is side-effect-ful.
                    const importModuleId = path.node.source.value;
                    // Unlink the module in the graph
                    const depId = [...value.dependencies.entries()].find(([key, dep]) => {
                        return dep.data.name === importModuleId;
                    })?.[0];
                    // Should never happen but we're playing with fire here.
                    if (!depId) {
                        throw new Error(`Failed to find graph key for import "${importModuleId}" from "${importModuleId}"`);
                    }
                    const dep = value.dependencies.get(depId);
                    const graphDep = graph.dependencies.get(dep.absolutePath);
                    // Remove inverse link to this dependency
                    graphDep.inverseDependencies.delete(value.path);
                    if (graphDep.inverseDependencies.size === 0) {
                        // Remove the dependency from the graph as no other modules are using it anymore.
                        graph.dependencies.delete(dep.absolutePath);
                    }
                    // Remove dependency from this module in the graph
                    value.dependencies.delete(depId);
                    // Delete the AST
                    path.remove();
                    removed = true;
                }
            },
        });
        return removed;
    }
    function treeShakeAll() {
        // This pass will parse all modules back to AST and include the import/export statements.
        for (const value of graph.dependencies.values()) {
            collectImportExports(value);
        }
        // This pass will annotate the AST with the used and unused exports.
        for (const [depId, value] of graph.dependencies.entries()) {
            treeShakeExports(depId, value);
            for (const index in value.output) {
                const outputItem = value.output[index];
                const ast = outputItem.data.ast;
                if (removeUnusedImports(value, ast)) {
                    // TODO: haha this is slow
                    treeShakeAll();
                }
            }
        }
    }
    treeShakeAll();
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
            const dependencyMapName = '';
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
            if (minify) {
                // ({ map, code } = await minifyCode(
                //   config,
                //   projectRoot,
                //   file.filename,
                //   code,
                //   file.code,
                //   map
                // ));
            }
            outputItem.data.code = (includeDebugInfo ? `\n// ${value.path}\n` : '') + outputCode;
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
    // console.log(
    //   require('util').inspect({ entryPoint, graph, options }, { depth: 20, colors: true })
    // );
    return [entryPoint, preModules, graph, options];
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
        // toFixture(...props);
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
    return (...props) => {
        for (const processor of processors) {
            if (processor) {
                props = processor(...props);
            }
        }
        return finalSerializer(...props);
    };
}
exports.createSerializerFromSerialProcessors = createSerializerFromSerialProcessors;
