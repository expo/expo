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
exports.computeHasteConflicts = computeHasteConflicts;
const path_1 = __importDefault(require("path"));
const constants_1 = __importDefault(require("../../constants"));
const sorting_1 = require("../../lib/sorting");
function computeHasteConflicts(options) {
    const { duplicates, map, rootDir } = options;
    const conflicts = [];
    // Add duplicates reported by metro-file-map
    for (const [id, dupsByPlatform] of duplicates.entries()) {
        for (const [platform, conflictingModules] of dupsByPlatform) {
            conflicts.push({
                id,
                platform: platform === constants_1.default.GENERIC_PLATFORM ? null : platform,
                absolutePaths: [...conflictingModules.keys()]
                    .map((modulePath) => path_1.default.resolve(rootDir, modulePath))
                    // Sort for ease of testing
                    .sort(),
                type: 'duplicate',
            });
        }
    }
    // Add cases of "shadowing at a distance": a module with a platform suffix and
    // a module with a lower priority platform suffix (or no suffix), in different
    // directories.
    for (const [id, data] of map) {
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
                id,
                platform: null,
                absolutePaths: [...new Set([...conflictPaths, ...basePaths])]
                    .map((modulePath) => path_1.default.resolve(rootDir, modulePath))
                    // Sort for ease of testing
                    .sort(),
                type: 'shadowing',
            });
        }
    }
    // Sort for ease of testing
    conflicts.sort((0, sorting_1.chainComparators)((a, b) => (0, sorting_1.compareStrings)(a.type, b.type), (a, b) => (0, sorting_1.compareStrings)(a.id, b.id), (a, b) => (0, sorting_1.compareStrings)(a.platform, b.platform)));
    return conflicts;
}
