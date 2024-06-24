"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sideEffectsSerializerPlugin = exports.hasSideEffectWithDebugTrace = exports.hasSideEffect = void 0;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const fs_1 = __importDefault(require("fs"));
const minimatch_1 = __importDefault(require("minimatch"));
const path_1 = __importDefault(require("path"));
const treeShakeSerializerPlugin_1 = require("./treeShakeSerializerPlugin");
// const debug = require('debug')('expo:metro-config:serializer:side-effects') as typeof console.log;
function hasSideEffect(graph, value, checked = new Set()) {
    // @ts-expect-error: Not on type.
    if (value?.sideEffects) {
        return true;
    }
    // Recursively check if any of the dependencies have side effects.
    for (const depReference of value.dependencies.values()) {
        if (checked.has(depReference.absolutePath)) {
            continue;
        }
        checked.add(depReference.absolutePath);
        const dep = graph.dependencies.get(depReference.absolutePath);
        if (hasSideEffect(graph, dep, checked)) {
            return true;
        }
    }
    return false;
}
exports.hasSideEffect = hasSideEffect;
function hasSideEffectWithDebugTrace(graph, value, parentTrace = [value.path], checked = new Set()) {
    // @ts-expect-error: Not on type.
    if (value?.sideEffects) {
        // if (value.sideEffects !== true) {
        //   console.log('WUT:', value.path, value.sideEffects, parentTrace);
        // }
        return [true, parentTrace];
    }
    // Recursively check if any of the dependencies have side effects.
    for (const depReference of value.dependencies.values()) {
        if (checked.has(depReference.absolutePath)) {
            continue;
        }
        checked.add(depReference.absolutePath);
        const dep = graph.dependencies.get(depReference.absolutePath);
        const [hasSideEffect, trace] = hasSideEffectWithDebugTrace(graph, dep, [...parentTrace, depReference.absolutePath], checked);
        if (hasSideEffect) {
            return [true, trace];
        }
    }
    return [false, []];
}
exports.hasSideEffectWithDebugTrace = hasSideEffectWithDebugTrace;
// Iterate the graph and mark dependencies as side-effect-ful if they are marked as such in the package.json.
function sideEffectsSerializerPlugin(entryPoint, preModules, graph, options) {
    if (!(0, treeShakeSerializerPlugin_1.isShakingEnabled)(graph, options)) {
        return [entryPoint, preModules, graph, options];
    }
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
                // TODO: How to avoid needing this hardcoded list?
                if ([
                    'react',
                    '@babel/runtime',
                    'invariant',
                    'react-dom',
                    'scheduler',
                    'inline-style-prefixer',
                    'metro-runtime',
                    'fbjs',
                    '@react-native/normalize-color',
                    '@react-native/asset-registry',
                    'postcss-value-parser',
                    'css-in-js-utils',
                ].includes(packageJson.name)) {
                    console.log('Skipping FX for:', packageJson.name);
                    return false;
                }
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
        if (isSideEffect === false) {
            value.sideEffects = false;
        }
        else if (isSideEffect == null) {
            continue;
        }
        else {
            // @ts-expect-error: Not on type.
            value.sideEffects = isSideEffect(value.path);
        }
    }
    for (const value of graph.dependencies.values()) {
        console.log('FX:', value.path, value.sideEffects);
    }
    // This pass will surface all recursive dependencies that are side-effect-ful and mark them early
    // so we aren't redoing recursive checks later.
    // e.g. `./index.js` -> `./foo.js` -> `./bar.js` -> `./baz.js` (side-effect)
    // All modules will be marked as side-effect-ful.
    for (const value of graph.dependencies.values()) {
        // if (hasSideEffect(graph, value)) {
        const [fx, trace] = hasSideEffectWithDebugTrace(graph, value);
        if (fx) {
            // @ts-expect-error: Not on type.
            value.sideEffects = true;
            if (value.path.includes('react')) {
                console.log('DEEP TRACE:', value.path, trace);
            }
        }
    }
    for (const value of graph.dependencies.values()) {
        console.log('Deep FX:', value.path, value.sideEffects);
    }
    return [entryPoint, preModules, graph, options];
}
exports.sideEffectsSerializerPlugin = sideEffectsSerializerPlugin;
//# sourceMappingURL=sideEffectsSerializerPlugin.js.map