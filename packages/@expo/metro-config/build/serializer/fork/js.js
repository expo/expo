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
exports.isJsOutput = exports.isJsModule = exports.getJsOutput = exports.getExportPathForDependency = exports.getModuleParams = exports.wrapModule = void 0;
const invariant_1 = __importDefault(require("invariant"));
const jsc_safe_url_1 = __importDefault(require("jsc-safe-url"));
const metro_transform_plugins_1 = require("metro-transform-plugins");
const path_1 = __importDefault(require("path"));
function wrapModule(module, options) {
    const output = getJsOutput(module);
    if (output.type.startsWith('js/script')) {
        return { src: output.data.code, paths: {} };
    }
    const { params, paths } = getModuleParams(module, options);
    const src = (0, metro_transform_plugins_1.addParamsToDefineCall)(output.data.code, ...params);
    return { src, paths };
}
exports.wrapModule = wrapModule;
function getModuleParams(module, options) {
    const moduleId = options.createModuleId(module.path);
    const paths = {};
    let hasPaths = false;
    const dependencyMapArray = Array.from(module.dependencies.values()).map((dependency) => {
        const id = options.createModuleId(dependency.absolutePath);
        if (options.includeAsyncPaths && dependency.data.data.asyncType != null) {
            hasPaths = true;
            (0, invariant_1.default)(options.sourceUrl != null, 'sourceUrl is required when includeAsyncPaths is true');
            // TODO: Only include path if the target is not in the bundle
            // Construct a server-relative URL for the split bundle, propagating
            // most parameters from the main bundle's URL.
            const { searchParams } = new URL(jsc_safe_url_1.default.toNormalUrl(options.sourceUrl));
            searchParams.set('modulesOnly', 'true');
            searchParams.set('runModule', 'false');
            const bundlePath = path_1.default.relative(options.serverRoot, dependency.absolutePath);
            if (options.dev) {
                paths[id] =
                    '/' +
                        path_1.default.join(path_1.default.dirname(bundlePath), 
                        // Strip the file extension
                        path_1.default.basename(bundlePath, path_1.default.extname(bundlePath))) +
                        '.bundle?' +
                        searchParams.toString();
            }
            else {
                // NOTE(EvanBacon): Custom block for bundle splitting in production according to how `expo export` works
                // TODO: Add content hash
                paths[id] = getExportPathForDependency(dependency, options);
            }
        }
        return id;
    });
    const params = [
        moduleId,
        hasPaths
            ? {
                // $FlowIgnore[not-an-object] Intentionally spreading an array into an object
                ...dependencyMapArray,
                paths,
            }
            : dependencyMapArray,
    ];
    if (options.dev) {
        // Add the relative path of the module to make debugging easier.
        // This is mapped to `module.verboseName` in `require.js`.
        params.push(path_1.default.relative(options.projectRoot, module.path));
    }
    return { params, paths };
}
exports.getModuleParams = getModuleParams;
function getExportPathForDependency(dependency, options) {
    // TODO: Add content hash
    const { searchParams } = new URL(jsc_safe_url_1.default.toNormalUrl(options.sourceUrl));
    const bundlePath = path_1.default.relative(options.serverRoot, dependency.absolutePath);
    return ('/' +
        path_1.default.join(path_1.default.dirname(bundlePath), 
        // Strip the file extension
        path_1.default.basename(bundlePath, path_1.default.extname(bundlePath))) +
        '.' +
        searchParams.get('platform') +
        '.js');
}
exports.getExportPathForDependency = getExportPathForDependency;
function getJsOutput(module) {
    const jsModules = module.output.filter(({ type }) => type.startsWith('js/'));
    (0, invariant_1.default)(jsModules.length === 1, `Modules must have exactly one JS output, but ${module.path ?? 'unknown module'} has ${jsModules.length} JS outputs.`);
    const jsOutput = jsModules[0];
    //   const jsOutput: JsOutput = (jsModules[0]: any);
    (0, invariant_1.default)(Number.isFinite(jsOutput.data.lineCount), `JS output must populate lineCount, but ${module.path ?? 'unknown module'} has ${jsOutput.type} output with lineCount '${jsOutput.data.lineCount}'`);
    return jsOutput;
}
exports.getJsOutput = getJsOutput;
function isJsModule(module) {
    return module.output.filter(isJsOutput).length > 0;
}
exports.isJsModule = isJsModule;
function isJsOutput(output) {
    return output.type.startsWith('js/');
}
exports.isJsOutput = isJsOutput;
