"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const constants_1 = __importDefault(require("../constants"));
const RootPathUtils_1 = require("../lib/RootPathUtils");
const sorting_1 = require("../lib/sorting");
const DuplicateHasteCandidatesError_1 = require("./haste/DuplicateHasteCandidatesError");
const HasteConflictsError_1 = require("./haste/HasteConflictsError");
const getPlatformExtension_1 = __importDefault(require("./haste/getPlatformExtension"));
const EMPTY_OBJ = {};
const EMPTY_MAP = new Map();
const PACKAGE_JSON = /(?:[/\\]|^)package\.json$/;
// Periodically yield to the event loop to allow parallel I/O, etc.
// Based on 200k files taking up to 800ms => max 40ms between yields.
const YIELD_EVERY_NUM_HASTE_FILES = 10000;
class HastePlugin {
    name = 'haste';
    #console;
    #duplicates = new Map();
    #enableHastePackages;
    #failValidationOnConflicts;
    #getModuleNameByPath;
    #hasteImplModulePath;
    #map = new Map();
    #pathUtils;
    #perfLogger;
    #platforms;
    #rootDir;
    constructor(options) {
        this.#console = options.console ?? globalThis.console;
        this.#enableHastePackages = options.enableHastePackages;
        this.#hasteImplModulePath = options.hasteImplModulePath;
        this.#perfLogger = options.perfLogger;
        this.#platforms = options.platforms;
        this.#rootDir = options.rootDir;
        this.#pathUtils = new RootPathUtils_1.RootPathUtils(options.rootDir);
        this.#failValidationOnConflicts = options.failValidationOnConflicts;
    }
    async initialize({ files }) {
        this.#perfLogger?.point('constructHasteMap_start');
        let hasteFiles = 0;
        for (const { baseName, canonicalPath, pluginData: hasteId } of files.fileIterator({
            // Symlinks and node_modules are never Haste modules or packages.
            includeNodeModules: false,
            includeSymlinks: false,
        })) {
            if (hasteId == null) {
                continue;
            }
            this.setModule(hasteId, [
                canonicalPath,
                this.#enableHastePackages && baseName === 'package.json' ? constants_1.default.PACKAGE : constants_1.default.MODULE,
            ]);
            if (++hasteFiles % YIELD_EVERY_NUM_HASTE_FILES === 0) {
                await new Promise(setImmediate);
            }
        }
        this.#getModuleNameByPath = (mixedPath) => {
            const result = files.lookup(mixedPath);
            return result.exists && result.type === 'f' && typeof result.pluginData === 'string'
                ? result.pluginData
                : null;
        };
        this.#perfLogger?.point('constructHasteMap_end');
        this.#perfLogger?.annotate({ int: { hasteFiles } });
    }
    getSerializableSnapshot() {
        // Haste is not serialised, but built from traversing the file metadata
        // on each run. This turns out to have comparable performance to
        // serialisation, at least when Haste is dense, and makes for a much
        // smaller cache.
        return null;
    }
    getModule(name, platform, supportsNativePlatform, type) {
        const module = this.#getModuleMetadata(name, platform, !!supportsNativePlatform);
        if (module && module[constants_1.default.TYPE] === (type ?? constants_1.default.MODULE)) {
            const modulePath = module[constants_1.default.PATH];
            return modulePath && this.#pathUtils.normalToAbsolute(modulePath);
        }
        return null;
    }
    getModuleNameByPath(mixedPath) {
        if (this.#getModuleNameByPath == null) {
            throw new Error('HastePlugin has not been initialized before getModuleNameByPath');
        }
        return this.#getModuleNameByPath(mixedPath) ?? null;
    }
    getPackage(name, platform, _supportsNativePlatform) {
        return this.getModule(name, platform, null, constants_1.default.PACKAGE);
    }
    /**
     * When looking up a module's data, we walk through each eligible platform for
     * the query. For each platform, we want to check if there are known
     * duplicates for that name+platform pair. The duplication logic normally
     * removes elements from the `map` object, but we want to check upfront to be
     * extra sure. If metadata exists both in the `duplicates` object and the
     * `map`, this would be a bug.
     */
    #getModuleMetadata(name, platform, supportsNativePlatform) {
        const map = this.#map.get(name) || EMPTY_OBJ;
        const dupMap = this.#duplicates.get(name) || EMPTY_MAP;
        if (platform != null) {
            this.#assertNoDuplicates(name, platform, supportsNativePlatform, dupMap.get(platform));
            if (map[platform] != null) {
                return map[platform];
            }
        }
        if (supportsNativePlatform) {
            this.#assertNoDuplicates(name, constants_1.default.NATIVE_PLATFORM, supportsNativePlatform, dupMap.get(constants_1.default.NATIVE_PLATFORM));
            if (map[constants_1.default.NATIVE_PLATFORM]) {
                return map[constants_1.default.NATIVE_PLATFORM];
            }
        }
        this.#assertNoDuplicates(name, constants_1.default.GENERIC_PLATFORM, supportsNativePlatform, dupMap.get(constants_1.default.GENERIC_PLATFORM));
        if (map[constants_1.default.GENERIC_PLATFORM]) {
            return map[constants_1.default.GENERIC_PLATFORM];
        }
        return null;
    }
    #assertNoDuplicates(name, platform, supportsNativePlatform, relativePathSet) {
        if (relativePathSet == null) {
            return;
        }
        const duplicates = new Map();
        for (const [relativePath, type] of relativePathSet) {
            const duplicatePath = this.#pathUtils.normalToAbsolute(relativePath);
            duplicates.set(duplicatePath, type);
        }
        throw new DuplicateHasteCandidatesError_1.DuplicateHasteCandidatesError(name, platform, supportsNativePlatform, duplicates);
    }
    onChanged(delta) {
        // Process removals first so that moves aren't treated as duplicates.
        for (const [canonicalPath, maybeHasteId] of delta.removedFiles) {
            this.#onRemovedFile(canonicalPath, maybeHasteId);
        }
        for (const [canonicalPath, maybeHasteId] of delta.addedFiles) {
            this.#onNewFile(canonicalPath, maybeHasteId);
        }
    }
    #onNewFile(canonicalPath, id) {
        if (id == null) {
            // Not a Haste module or package
            return;
        }
        const module = [
            canonicalPath,
            this.#enableHastePackages && path_1.default.basename(canonicalPath) === 'package.json'
                ? constants_1.default.PACKAGE
                : constants_1.default.MODULE,
        ];
        this.setModule(id, module);
    }
    setModule(id, module) {
        let hasteMapItem = this.#map.get(id);
        if (!hasteMapItem) {
            hasteMapItem = Object.create(null);
            this.#map.set(id, hasteMapItem);
        }
        const platform = (0, getPlatformExtension_1.default)(module[constants_1.default.PATH], this.#platforms) || constants_1.default.GENERIC_PLATFORM;
        const existingModule = hasteMapItem[platform];
        if (existingModule && existingModule[constants_1.default.PATH] !== module[constants_1.default.PATH]) {
            if (this.#console) {
                this.#console.warn([
                    'metro-file-map: Haste module naming collision: ' + id,
                    '  The following files share their name; please adjust your hasteImpl:',
                    '    * <rootDir>' + path_1.default.sep + existingModule[constants_1.default.PATH],
                    '    * <rootDir>' + path_1.default.sep + module[constants_1.default.PATH],
                    '',
                ].join('\n'));
            }
            // We do NOT want consumers to use a module that is ambiguous.
            delete hasteMapItem[platform];
            if (Object.keys(hasteMapItem).length === 0) {
                this.#map.delete(id);
            }
            let dupsByPlatform = this.#duplicates.get(id);
            if (dupsByPlatform == null) {
                dupsByPlatform = new Map();
                this.#duplicates.set(id, dupsByPlatform);
            }
            const dups = new Map([
                [module[constants_1.default.PATH], module[constants_1.default.TYPE]],
                [existingModule[constants_1.default.PATH], existingModule[constants_1.default.TYPE]],
            ]);
            dupsByPlatform.set(platform, dups);
            return;
        }
        const dupsByPlatform = this.#duplicates.get(id);
        if (dupsByPlatform != null) {
            const dups = dupsByPlatform.get(platform);
            if (dups != null) {
                dups.set(module[constants_1.default.PATH], module[constants_1.default.TYPE]);
            }
            return;
        }
        hasteMapItem[platform] = module;
    }
    #onRemovedFile(canonicalPath, moduleName) {
        if (moduleName == null) {
            // Not a Haste module or package
            return;
        }
        const platform = (0, getPlatformExtension_1.default)(canonicalPath, this.#platforms) || constants_1.default.GENERIC_PLATFORM;
        const hasteMapItem = this.#map.get(moduleName);
        if (hasteMapItem != null) {
            delete hasteMapItem[platform];
            if (Object.keys(hasteMapItem).length === 0) {
                this.#map.delete(moduleName);
            }
            else {
                this.#map.set(moduleName, hasteMapItem);
            }
        }
        this.#recoverDuplicates(moduleName, canonicalPath);
    }
    assertValid() {
        if (!this.#failValidationOnConflicts) {
            return;
        }
        const conflicts = this.computeConflicts();
        if (conflicts.length > 0) {
            throw new HasteConflictsError_1.HasteConflictsError(conflicts);
        }
    }
    /**
     * This function should be called when the file under `filePath` is removed
     * or changed. When that happens, we want to figure out if that file was
     * part of a group of files that had the same ID. If it was, we want to
     * remove it from the group. Furthermore, if there is only one file
     * remaining in the group, then we want to restore that single file as the
     * correct resolution for its ID, and cleanup the duplicates index.
     */
    #recoverDuplicates(moduleName, relativeFilePath) {
        let dupsByPlatform = this.#duplicates.get(moduleName);
        if (dupsByPlatform == null) {
            return;
        }
        const platform = (0, getPlatformExtension_1.default)(relativeFilePath, this.#platforms) || constants_1.default.GENERIC_PLATFORM;
        let dups = dupsByPlatform.get(platform);
        if (dups == null) {
            return;
        }
        dupsByPlatform = new Map(dupsByPlatform);
        this.#duplicates.set(moduleName, dupsByPlatform);
        dups = new Map(dups);
        dupsByPlatform.set(platform, dups);
        dups.delete(relativeFilePath);
        if (dups.size !== 1) {
            return;
        }
        const uniqueModule = dups.entries().next().value;
        if (!uniqueModule) {
            return;
        }
        let dedupMap = this.#map.get(moduleName);
        if (dedupMap == null) {
            dedupMap = Object.create(null);
            this.#map.set(moduleName, dedupMap);
        }
        dedupMap[platform] = uniqueModule;
        dupsByPlatform.delete(platform);
        if (dupsByPlatform.size === 0) {
            this.#duplicates.delete(moduleName);
        }
    }
    computeConflicts() {
        const conflicts = [];
        // Add literal duplicates tracked in the #duplicates map
        for (const [id, dupsByPlatform] of this.#duplicates.entries()) {
            for (const [platform, conflictingModules] of dupsByPlatform) {
                conflicts.push({
                    absolutePaths: [...conflictingModules.keys()]
                        .map((modulePath) => this.#pathUtils.normalToAbsolute(modulePath))
                        // Sort for ease of testing
                        .sort(),
                    id,
                    platform: platform === constants_1.default.GENERIC_PLATFORM ? null : platform,
                    type: 'duplicate',
                });
            }
        }
        // Add cases of "shadowing at a distance": a module with a platform suffix and
        // a module with a lower priority platform suffix (or no suffix), in different
        // directories.
        for (const [id, data] of this.#map) {
            const conflictPaths = new Set();
            const basePaths = [];
            for (const basePlatform of [constants_1.default.NATIVE_PLATFORM, constants_1.default.GENERIC_PLATFORM]) {
                if (data[basePlatform] == null) {
                    continue;
                }
                const basePath = data[basePlatform][0];
                basePaths.push(basePath);
                const basePathDir = path_1.default.dirname(basePath);
                // Find all platforms that can shadow basePlatform
                // Given that X.(specific platform).js > x.native.js > X.js
                // and basePlatform is either 'native' or generic (no platform).
                for (const platform of Object.keys(data)) {
                    if (platform === basePlatform || platform === constants_1.default.GENERIC_PLATFORM /* lowest priority */) {
                        continue;
                    }
                    const platformPath = data[platform][0];
                    if (path_1.default.dirname(platformPath) !== basePathDir) {
                        conflictPaths.add(platformPath);
                    }
                }
            }
            if (conflictPaths.size) {
                conflicts.push({
                    absolutePaths: [...new Set([...conflictPaths, ...basePaths])]
                        .map((modulePath) => this.#pathUtils.normalToAbsolute(modulePath))
                        // Sort for ease of testing
                        .sort(),
                    id,
                    platform: null,
                    type: 'shadowing',
                });
            }
        }
        // Sort for ease of testing
        conflicts.sort((0, sorting_1.chainComparators)((a, b) => (0, sorting_1.compareStrings)(a.type, b.type), (a, b) => (0, sorting_1.compareStrings)(a.id, b.id), (a, b) => (0, sorting_1.compareStrings)(a.platform, b.platform)));
        return conflicts;
    }
    getCacheKey() {
        return JSON.stringify([
            this.#enableHastePackages,
            this.#hasteImplModulePath != null ? require(this.#hasteImplModulePath).getCacheKey() : null,
            [...this.#platforms].sort(),
        ]);
    }
    getWorker() {
        return {
            worker: {
                modulePath: require.resolve('./haste/worker.js'),
                setupArgs: {
                    hasteImplModulePath: this.#hasteImplModulePath ?? null,
                },
            },
            filter: ({ isNodeModules, normalPath }) => {
                if (isNodeModules) {
                    return false;
                }
                if (PACKAGE_JSON.test(normalPath)) {
                    return this.#enableHastePackages;
                }
                return this.#hasteImplModulePath != null;
            },
        };
    }
}
exports.default = HastePlugin;
