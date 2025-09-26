"use strict";
/**
 * Copyright © 2025 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork with support for using the same serializer paths as production and the first bundle.
 * https://github.com/facebook/metro/blob/87f717b8f5987827c75c82b3cb390060672628f0/packages/metro/src/DeltaBundler/Serializers/hmrJSBundle.js#L1C1-L152C30
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const metro_transform_plugins_1 = require("@expo/metro/metro-transform-plugins");
const jsc_safe_url_1 = __importDefault(require("jsc-safe-url"));
const node_path_1 = __importDefault(require("node:path"));
const js_1 = require("./js");
const debug = require('debug')('Metro:HMR');
function generateModules(sourceModules, graph, options) {
    const modules = [];
    for (const module of sourceModules) {
        if ((0, js_1.isJsModule)(module)) {
            const getPathname = (extension) => {
                return (node_path_1.default
                    .relative(options.serverRoot ?? options.projectRoot, node_path_1.default.join(node_path_1.default.dirname(module.path), node_path_1.default.basename(module.path, node_path_1.default.extname(module.path)) + '.' + extension))
                    .split(node_path_1.default.sep)
                    // using this Metro particular convention for encoding file paths as URL paths.
                    .map((segment) => encodeURIComponent(segment))
                    .join('/'));
            };
            const clientUrl = new URL(options.clientUrl);
            clientUrl.searchParams.delete('excludeSource');
            clientUrl.pathname = getPathname('map');
            const sourceMappingURL = clientUrl.toString();
            clientUrl.pathname = getPathname('bundle');
            const sourceURL = jsc_safe_url_1.default.toJscSafeUrl(clientUrl.toString());
            debug('got sourceMappingURL: %s\nand sourceURL: %s\nfor module: %s', sourceMappingURL, sourceURL, module.path);
            const code = prepareModule(module, graph, options) +
                `\n//# sourceMappingURL=${sourceMappingURL}\n` +
                `//# sourceURL=${sourceURL}\n`;
            modules.push({
                module: [options.createModuleId(module.path), code],
                sourceMappingURL,
                sourceURL,
            });
        }
    }
    return modules;
}
function prepareModule(module, graph, options) {
    const code = (0, js_1.wrapModule)(module, {
        ...options,
        sourceUrl: options.clientUrl.toString(),
        dev: true,
        skipWrapping: false,
        computedAsyncModulePaths: null,
        splitChunks: false,
    });
    const inverseDependencies = getInverseDependencies(module.path, graph);
    // Transform the inverse dependency paths to ids.
    const inverseDependenciesById = Object.create(null);
    Object.keys(inverseDependencies).forEach((path) => {
        inverseDependenciesById[options.createModuleId(path)] = inverseDependencies[path].map(options.createModuleId);
    });
    return (0, metro_transform_plugins_1.addParamsToDefineCall)(code.src, inverseDependenciesById);
}
/**
 * Instead of adding the whole inverseDependencies object into each changed
 * module (which can be really huge if the dependency graph is big), we only
 * add the needed inverseDependencies for each changed module (we do this by
 * traversing upwards the dependency graph).
 */
function getInverseDependencies(path, graph, inverseDependencies = {}) {
    // Dependency already traversed.
    if (path in inverseDependencies) {
        return inverseDependencies;
    }
    const module = graph.dependencies.get(path);
    if (!module) {
        return inverseDependencies;
    }
    inverseDependencies[path] = [];
    for (const inverse of module.inverseDependencies) {
        inverseDependencies[path].push(inverse);
        getInverseDependencies(inverse, graph, inverseDependencies);
    }
    return inverseDependencies;
}
function hmrJSBundle(delta, graph, options) {
    return {
        added: generateModules(delta.added.values(), graph, options),
        modified: generateModules(delta.modified.values(), graph, options),
        deleted: [...delta.deleted].map((path) => options.createModuleId(path)),
    };
}
exports.default = hmrJSBundle;
//# sourceMappingURL=hmrJSBundle.js.map