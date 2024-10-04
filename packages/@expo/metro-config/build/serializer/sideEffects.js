"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVirtualModule = exports._createSideEffectMatcher = exports.hasSideEffectWithDebugTrace = void 0;
/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const fs_1 = __importDefault(require("fs"));
const minimatch_1 = __importDefault(require("minimatch"));
const path_1 = __importDefault(require("path"));
const findUpPackageJsonPath_1 = require("./findUpPackageJsonPath");
const debug = require('debug')('expo:side-effects');
function hasSideEffectWithDebugTrace(options, graph, value, parentTrace = [value.path], checked = new Set()) {
    const currentModuleHasSideEffect = getShallowSideEffect(options, value);
    if (currentModuleHasSideEffect) {
        return [true, parentTrace];
    }
    // Recursively check if any of the dependencies have side effects.
    for (const depReference of value.dependencies.values()) {
        if (checked.has(depReference.absolutePath)) {
            continue;
        }
        checked.add(depReference.absolutePath);
        const dep = graph.dependencies.get(depReference.absolutePath);
        if (!dep) {
            continue;
        }
        const [hasSideEffect, trace] = hasSideEffectWithDebugTrace(options, graph, dep, [...parentTrace, depReference.absolutePath], checked);
        if (hasSideEffect) {
            // Propagate the side effect to the parent.
            value.sideEffects = true;
            return [true, trace];
        }
    }
    return [currentModuleHasSideEffect, []];
}
exports.hasSideEffectWithDebugTrace = hasSideEffectWithDebugTrace;
const pkgJsonCache = new Map();
const getPackageJsonMatcher = (options, dir) => {
    let packageJson;
    let packageJsonPath = null;
    if (typeof options._test_getPackageJson === 'function') {
        [packageJson, packageJsonPath] = options._test_getPackageJson(dir);
    }
    else {
        const cached = pkgJsonCache.get(dir);
        if (cached) {
            return cached;
        }
        packageJsonPath = (0, findUpPackageJsonPath_1.findUpPackageJsonPath)(dir);
        packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf-8'));
    }
    if (!packageJsonPath) {
        return null;
    }
    // TODO: Split out and unit test.
    const dirRoot = path_1.default.dirname(packageJsonPath);
    const isSideEffect = _createSideEffectMatcher(dirRoot, packageJson, packageJsonPath);
    pkgJsonCache.set(dir, isSideEffect);
    return isSideEffect;
};
function _createSideEffectMatcher(dirRoot, packageJson, packageJsonPath = '') {
    return (fp) => {
        // Default is that everything is a side-effect unless explicitly marked as not.
        if (packageJson.sideEffects == null) {
            return null;
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
        debug('Invalid sideEffects field in package.json:', packageJsonPath, packageJson.sideEffects);
        return null;
    };
}
exports._createSideEffectMatcher = _createSideEffectMatcher;
function getShallowSideEffect(options, value) {
    if (value?.sideEffects !== undefined) {
        return value.sideEffects;
    }
    const isSideEffect = detectHasSideEffectInPackageJson(options, value);
    value.sideEffects = isSideEffect;
    return isSideEffect;
}
function detectHasSideEffectInPackageJson(options, value) {
    if (value.sideEffects !== undefined) {
        return value.sideEffects;
    }
    // Don't perform lookup on virtual modules.
    if (isVirtualModule(value.path)) {
        return false;
    }
    if (value.output.some((output) => output.type === 'js/module')) {
        const isSideEffect = getPackageJsonMatcher(options, value.path);
        if (isSideEffect == null) {
            return null;
        }
        return isSideEffect(value.path);
    }
    return null;
}
function isVirtualModule(path) {
    return path.startsWith('\0');
}
exports.isVirtualModule = isVirtualModule;
//# sourceMappingURL=sideEffects.js.map