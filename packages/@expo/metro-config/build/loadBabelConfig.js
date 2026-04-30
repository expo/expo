"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadBabelConfig = void 0;
/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const BABEL_CONFIG_NAMES = [
    '.babelrc',
    '.babelrc.js',
    '.babelrc.cjs',
    '.babelrc.mjs',
    '.babelrc.json',
    '.babelrc.cts',
    'babel.config.js',
    'babel.config.cjs',
    'babel.config.mjs',
    'babel.config.json',
    'babel.config.cts',
    'babel.config.ts',
    'babel.config.mts',
];
/**
 * Returns a memoized function that checks for the existence of a
 * project-level .babelrc file. If it doesn't exist, it reads the
 * default React Native babelrc file and uses that.
 */
exports.loadBabelConfig = (function () {
    let result = null;
    return function _getBabelRC(options) {
        if (result == null) {
            const { projectRoot, enableBabelRCLookup = true } = options;
            result = {};
            if (options.projectRoot && enableBabelRCLookup) {
                // Check for various babel config files in the project root
                // TODO(@kitten): We should move this to the `customTransformOptions` to make this
                // participate in the cache key. We should also add `getCacheKey` to `babel-transformer`
                // and then take this into account there
                const foundBabelRCPath = BABEL_CONFIG_NAMES.find((configFileName) => {
                    return node_fs_1.default.existsSync(node_path_1.default.resolve(projectRoot, configFileName));
                });
                // Extend the config if a babel config file is found
                if (foundBabelRCPath) {
                    result.exts = node_path_1.default.resolve(projectRoot, foundBabelRCPath);
                }
            }
            // Use the default preset for react-native if no babel config file is found
            if (!result.exts) {
                try {
                    result.presets = [require('expo/internal/babel-preset')];
                }
                catch {
                    // TODO(@kitten): Temporary, since our E2E tests don't use monorepo
                    // packages consistently, including the `expo` package
                    result.presets = [require('babel-preset-expo')];
                }
            }
        }
        return result;
    };
})();
//# sourceMappingURL=loadBabelConfig.js.map