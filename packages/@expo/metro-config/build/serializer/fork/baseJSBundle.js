"use strict";
/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseJSBundle = void 0;
const getAppendScripts_1 = __importDefault(require("metro/src/lib/getAppendScripts"));
const processModules_1 = require("./processModules");
function baseJSBundle(entryPoint, preModules, graph, options) {
    for (const module of graph.dependencies.values()) {
        options.createModuleId(module.path);
    }
    const processModulesOptions = {
        filter: options.processModuleFilter,
        createModuleId: options.createModuleId,
        dev: options.dev,
        includeAsyncPaths: options.includeAsyncPaths,
        projectRoot: options.projectRoot,
        serverRoot: options.serverRoot,
        sourceUrl: options.sourceUrl,
    };
    // Do not prepend polyfills or the require runtime when only modules are requested
    if (options.modulesOnly) {
        preModules = [];
    }
    const preCode = (0, processModules_1.processModules)(preModules, processModulesOptions)
        .map(([_, code]) => code.src)
        .join('\n');
    const modules = [...graph.dependencies.values()].sort((a, b) => options.createModuleId(a.path) - options.createModuleId(b.path));
    const postCode = (0, processModules_1.processModules)((0, getAppendScripts_1.default)(entryPoint, [...preModules, ...modules], {
        asyncRequireModulePath: options.asyncRequireModulePath,
        createModuleId: options.createModuleId,
        getRunModuleStatement: options.getRunModuleStatement,
        inlineSourceMap: options.inlineSourceMap,
        runBeforeMainModule: options.runBeforeMainModule,
        runModule: options.runModule,
        shouldAddToIgnoreList: options.shouldAddToIgnoreList,
        sourceMapUrl: options.sourceMapUrl,
        sourceUrl: options.sourceUrl,
    }), processModulesOptions)
        .map(([_, code]) => code.src)
        .join('\n');
    const mods = (0, processModules_1.processModules)([...graph.dependencies.values()], processModulesOptions).map(([module, code]) => [options.createModuleId(module.path), code]);
    return {
        pre: preCode,
        post: postCode,
        modules: mods.map(([id, code]) => [id, typeof code === 'number' ? code : code.src]),
        _expoSplitBundlePaths: mods.map(([id, code]) => [
            id,
            typeof code === 'number' ? {} : code.paths,
        ]),
    };
}
exports.baseJSBundle = baseJSBundle;
