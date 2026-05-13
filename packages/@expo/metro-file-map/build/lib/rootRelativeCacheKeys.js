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
exports.default = rootRelativeCacheKeys;
const crypto_1 = require("crypto");
const RootPathUtils_1 = require("./RootPathUtils");
const normalizePathSeparatorsToPosix_1 = __importDefault(require("./normalizePathSeparatorsToPosix"));
function rootRelativeCacheKeys(buildParameters) {
    const { rootDir, plugins, ...otherParameters } = buildParameters;
    const rootDirHash = (0, crypto_1.createHash)('md5')
        .update((0, normalizePathSeparatorsToPosix_1.default)(rootDir))
        .digest('hex');
    const pathUtils = new RootPathUtils_1.RootPathUtils(rootDir);
    const cacheComponents = Object.keys(otherParameters)
        .sort()
        .map((key) => {
        switch (key) {
            case 'roots':
                return buildParameters[key].map((root) => (0, normalizePathSeparatorsToPosix_1.default)(pathUtils.absoluteToNormal(root)));
            case 'cacheBreaker':
            case 'extensions':
            case 'computeSha1':
            case 'enableSymlinks':
            case 'retainAllFiles':
                return buildParameters[key] ?? null;
            case 'ignorePattern':
                return buildParameters[key]?.toString() ?? null;
            case 'forceNodeFilesystemAPI':
                return null;
            default:
                key;
                throw new Error('Unrecognised key in build parameters: ' + key);
        }
    });
    for (const plugin of plugins) {
        cacheComponents.push(plugin.getCacheKey());
    }
    // JSON.stringify is stable here because we only deal in (nested) arrays of
    // primitives. Use a different approach if this is expanded to include
    // objects/Sets/Maps, etc.
    const relativeConfigHash = (0, crypto_1.createHash)('md5')
        .update(JSON.stringify(cacheComponents))
        .digest('hex');
    return {
        rootDirHash,
        relativeConfigHash,
    };
}
