"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasSideEffectWithDebugTrace = hasSideEffectWithDebugTrace;
exports._createSideEffectMatcher = _createSideEffectMatcher;
exports.isVirtualModule = isVirtualModule;
const isResolvedDependency_1 = require("@expo/metro/metro/lib/isResolvedDependency");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const picomatch_1 = __importDefault(require("picomatch"));
const findUpPackageJsonPath_1 = require("./findUpPackageJsonPath");
const filePath_1 = require("../utils/filePath");
const debug = require('debug')('expo:side-effects');
function hasSideEffectWithDebugTrace(options, graph, value, parentTrace = [value.path], checked = new Set()) {
    const currentModuleHasSideEffect = getShallowSideEffect(options, value);
    if (currentModuleHasSideEffect) {
        return [true, parentTrace];
    }
    // Recursively check if any of the dependencies have side effects.
    for (const depReference of value.dependencies.values()) {
        if (!(0, isResolvedDependency_1.isResolvedDependency)(depReference) || checked.has(depReference.absolutePath)) {
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
    let sideEffectMatcher;
    if (Array.isArray(packageJson.sideEffects)) {
        const sideEffects = packageJson.sideEffects
            .filter((sideEffect) => typeof sideEffect === 'string')
            .map((sideEffect) => {
            const pattern = sideEffect.replace(/^\.\//, '');
            return pattern.includes('/') ? pattern : `**/${pattern}`;
        });
        sideEffectMatcher = (0, picomatch_1.default)(sideEffects);
    }
    else if (typeof packageJson.sideEffects === 'boolean' || !packageJson.sideEffects) {
        sideEffectMatcher = packageJson.sideEffects;
    }
    else {
        debug('Invalid sideEffects field in package.json:', packageJsonPath, packageJson.sideEffects);
    }
    return (fp) => {
        // Default is that everything is a side-effect unless explicitly marked as not.
        if (sideEffectMatcher == null) {
            return null;
        }
        else if (typeof sideEffectMatcher === 'boolean') {
            return sideEffectMatcher;
        }
        else {
            const relativeName = path_1.default.isAbsolute(fp) ? path_1.default.relative(dirRoot, fp) : path_1.default.normalize(fp);
            return sideEffectMatcher((0, filePath_1.toPosixPath)(relativeName));
        }
    };
}
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
//# sourceMappingURL=sideEffects.js.map