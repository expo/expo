"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSerializerFromSerialProcessors = exports.withSerializerPlugins = exports.withExpoSerializers = void 0;
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const jsc_safe_url_1 = require("jsc-safe-url");
const baseJSBundle_1 = require("./fork/baseJSBundle");
// import baseJSBundle from 'metro/src/DeltaBundler/Serializers/baseJSBundle';
const bundleToString_1 = __importDefault(require("metro/src/lib/bundleToString"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../env");
const environmentVariableSerializerPlugin_1 = require("./environmentVariableSerializerPlugin");
const getCssDeps_1 = require("./getCssDeps");
const js_1 = require("./fork/js");
function withExpoSerializers(config) {
    const processors = [];
    if (!env_1.env.EXPO_NO_CLIENT_ENV_VARS) {
        processors.push(environmentVariableSerializerPlugin_1.environmentVariableSerializerPlugin);
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
            customSerializer: createSerializerFromSerialProcessors(config.serializer ?? {}, processors, originalSerializer),
        },
    };
}
exports.withSerializerPlugins = withSerializerPlugins;
function getDefaultSerializer(serializerConfig, fallbackSerializer) {
    const defaultSerializer = fallbackSerializer ??
        (async (...params) => {
            const bundle = (0, baseJSBundle_1.baseJSBundle)(...params);
            const outputCode = (0, bundleToString_1.default)(bundle).code;
            return outputCode;
        });
    return async (...props) => {
        const [entryFile, preModules, graph, options] = props;
        // const jsCode = await defaultSerializer(...props);
        if (!options.sourceUrl) {
            return defaultSerializer(...props);
        }
        const sourceUrl = (0, jsc_safe_url_1.isJscSafeUrl)(options.sourceUrl)
            ? (0, jsc_safe_url_1.toNormalUrl)(options.sourceUrl)
            : options.sourceUrl;
        const url = new URL(sourceUrl, 'https://expo.dev');
        if (url.searchParams.get('platform') !== 'web' ||
            url.searchParams.get('serializer.output') !== 'static') {
            // Default behavior if `serializer.output=static` is not present in the URL.
            return defaultSerializer(...props);
        }
        const cssDeps = (0, getCssDeps_1.getCssSerialAssets)(graph.dependencies, {
            projectRoot: options.projectRoot,
            processModuleFilter: options.processModuleFilter,
        });
        // JS
        const jsAssets = [];
        // Create split graph from main graph
        const splitGraph = generateDependencyGraphForEachSplitPoint(new Set([entryFile]), graph).filter(Boolean);
        // console.log('splitty', entryFile, splitGraph.length);
        // moduleId: url
        // let dll: Record<number, string> = {};
        splitGraph.forEach(async (graph, index) => {
            if (!graph)
                return;
            const entryFile = graph.entryPoints[0];
            const entryDependency = graph.dependencies.get(entryFile);
            // const modulePath = entryDependency.path;
            // const moduleId = options.createModuleId(modulePath);
            const prependInner = index === 0 ? preModules : [];
            const fileName = path_1.default.basename(entryFile, '.js');
            const jsSplitBundle = (0, baseJSBundle_1.baseJSBundle)(entryFile, prependInner, graph, {
                ...options,
                runBeforeMainModule: serializerConfig.getModulesRunBeforeMainModule(path_1.default.relative(options.projectRoot, entryFile)),
                sourceMapUrl: `${fileName}.js.map`,
            });
            // console.log(
            //   '_expoSplitBundlePaths',
            //   graph.entryPoints,
            //   graph,
            //   jsSplitBundle._expoSplitBundlePaths
            // );
            // dll = { ...dll, ...jsSplitBundle._expoSplitBundlePaths };
            const jsCode = (0, bundleToString_1.default)(jsSplitBundle).code;
            // // Save sourcemap
            // const getSortedModules = (graph) => {
            //   return [...graph.dependencies.values()].sort(
            //     (a, b) => options.createModuleId(a.path) - options.createModuleId(b.path)
            //   );
            // };
            // const sourceMapString = require('metro/src/DeltaBundler/Serializers/sourceMapString');
            // const sourceMap = sourceMapString([...prependInner, ...getSortedModules(graph)], {
            //   // excludeSource: options.excludeSource,
            //   processModuleFilter: options.processModuleFilter,
            //   shouldAddToIgnoreList: options.shouldAddToIgnoreList,
            //   // excludeSource: options.excludeSource,
            // });
            // await writeFile(outputOpts.sourceMapOutput, sourceMap, null);
            console.log('entry >', entryDependency, entryDependency.dependencies);
            const relativeEntry = path_1.default.relative(options.projectRoot, entryFile);
            const outputFile = options.dev
                ? entryFile
                : (0, js_1.getExportPathForDependency)(entryFile, { sourceUrl, serverRoot: options.serverRoot });
            //  `_expo/static/js/web/${fileNameFromContents({
            //     filepath: relativeEntry,
            //     src: jsCode,
            //   })}.js`;
            // dll[moduleId] = '/' + outputFile;
            jsAssets.push({
                filename: outputFile,
                originFilename: relativeEntry,
                type: 'js',
                metadata: {},
                source: jsCode,
            });
        });
        // jsAssets.push({
        //   filename: '_expo/static/json/web/dll.json',
        //   originFilename: 'dll.json',
        //   type: 'json',
        //   metadata: {},
        //   source: JSON.stringify(dll),
        // });
        return JSON.stringify([...jsAssets, ...cssDeps]);
    };
}
const generateDependencyGraphForEachSplitPoint = (entryFiles, graph, multiBundles = new Map(), used = new Set()) => {
    entryFiles.forEach((entryFile) => {
        if (multiBundles.has(entryFile)) {
            return multiBundles;
        }
        const result = getTransitiveDependencies(entryFile, graph, used);
        multiBundles.set(entryFile, result.deps);
        used = new Set([...used, ...result.deps]);
        if (result.entries.size > 0) {
            generateDependencyGraphForEachSplitPoint(result.entries, graph, multiBundles, used);
        }
    });
    return buildDependenciesForEachSplitPoint(multiBundles, graph);
};
const getTransitiveDependencies = (path, graph, used) => {
    const result = collectDependenciesForSplitGraph(path, graph, new Set(), new Set(), used);
    result.deps.delete(path);
    return result;
};
const collectDependenciesForSplitGraph = (path, graph, deps, entries, used) => {
    if (deps.has(path) || used.has(path)) {
        return { deps, entries };
    }
    const module = graph.dependencies.get(path);
    if (!module) {
        return { deps, entries };
    }
    deps.add(path);
    for (const dependency of module.dependencies.values()) {
        if (dependency.data.data.asyncType === 'async') {
            entries.add(dependency.absolutePath);
        }
        else {
            collectDependenciesForSplitGraph(dependency.absolutePath, graph, deps, entries, used);
        }
    }
    return { deps, entries };
};
const buildDependenciesForEachSplitPoint = (multiBundles, graph) => {
    return [...multiBundles.entries()].map((bundle) => {
        const deps = [...bundle[1].values()].map((dep) => [dep, graph.dependencies.get(dep)]);
        if (!graph.dependencies.get(bundle[0])) {
            return null;
            // 'Async module is missing from graph. This can happen when lazy bundling is enabled'
        }
        return {
            dependencies: new Map([
                // Initial
                [bundle[0], graph.dependencies.get(bundle[0])],
                // Others
                ...deps,
            ]),
            entryPoints: [bundle[0]],
            // IDK...
            importBundleNames: new Set(),
        };
    });
};
function createSerializerFromSerialProcessors(config, processors, originalSerializer) {
    const finalSerializer = getDefaultSerializer(config, originalSerializer);
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
// __d((function(g,r,i,a,m,e,d){}),435,{"0":2,"1":18,"2":184,"3":103,"4":436,"5":438,"6":439,"paths":{"438":"/etc/external.bundle?platform=web"}});
