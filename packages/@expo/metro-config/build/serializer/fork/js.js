"use strict";
/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the metro helper, but with bundle splitting support.
 * https://github.com/facebook/metro/blob/bbdd7d7c5e6e0feb50a9967ffae1f723c1d7c4e8/packages/metro/src/DeltaBundler/Serializers/helpers/js.js#L1
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJsOutput = exports.isJsModule = exports.getJsOutput = exports.getModuleParams = exports.wrapModule = void 0;
const assert_1 = __importDefault(require("assert"));
const jsc_safe_url_1 = __importDefault(require("jsc-safe-url"));
const metro_transform_plugins_1 = require("metro-transform-plugins");
const path_1 = __importDefault(require("path"));
function wrapModule(module, options) {
    const output = getJsOutput(module);
    if (output.type.startsWith('js/script')) {
        return { src: output.data.code, paths: {} };
    }
    const { params, paths } = getModuleParams(module, options);
    let src = output.data.code;
    if (!options.skipWrapping) {
        src = (0, metro_transform_plugins_1.addParamsToDefineCall)(output.data.code, ...params);
    }
    return { src, paths };
}
exports.wrapModule = wrapModule;
function getModuleParams(module, options) {
    const moduleId = options.createModuleId(module.path);
    const paths = {};
    let hasPaths = false;
    const dependencyMapArray = Array.from(module.dependencies.values()).map((dependency) => {
        const id = options.createModuleId(dependency.absolutePath);
        if (
        // NOTE(EvanBacon): Disabled this to ensure that paths are provided even when the entire bundle
        // is created. This is required for production bundle splitting.
        // options.includeAsyncPaths &&
        dependency.data.data.asyncType != null) {
            if (options.includeAsyncPaths) {
                if (options.sourceUrl) {
                    hasPaths = true;
                    // TODO: Only include path if the target is not in the bundle
                    // Construct a server-relative URL for the split bundle, propagating
                    // most parameters from the main bundle's URL.
                    const { searchParams } = new URL(jsc_safe_url_1.default.toNormalUrl(options.sourceUrl));
                    searchParams.set('modulesOnly', 'true');
                    searchParams.set('runModule', 'false');
                    const bundlePath = path_1.default.relative(options.serverRoot, dependency.absolutePath);
                    paths[id] =
                        '/' +
                            path_1.default.join(path_1.default.dirname(bundlePath), 
                            // Strip the file extension
                            path_1.default.basename(bundlePath, path_1.default.extname(bundlePath))) +
                            '.bundle?' +
                            searchParams.toString();
                }
            }
            else if (options.splitChunks && options.computedAsyncModulePaths != null) {
                hasPaths = true;
                // A template string that we'll match and replace later when we know the content hash for a given path.
                paths[id] = options.computedAsyncModulePaths[dependency.absolutePath];
            }
        }
        return id;
    });
    const params = [
        moduleId,
        hasPaths
            ? {
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
function getJsOutput(module) {
    const jsModules = module.output.filter(({ type }) => type.startsWith('js/'));
    (0, assert_1.default)(jsModules.length === 1, `Modules must have exactly one JS output, but ${module.path ?? 'unknown module'} has ${jsModules.length} JS outputs.`);
    const jsOutput = jsModules[0];
    (0, assert_1.default)(Number.isFinite(jsOutput.data.lineCount), `JS output must populate lineCount, but ${module.path ?? 'unknown module'} has ${jsOutput.type} output with lineCount '${jsOutput.data.lineCount}'`);
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
//# sourceMappingURL=js.js.map