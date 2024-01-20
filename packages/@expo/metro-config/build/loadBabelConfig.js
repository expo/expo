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
/**
 * Returns a memoized function that checks for the existence of a
 * project-level .babelrc file. If it doesn't exist, it reads the
 * default React Native babelrc file and uses that.
 */
exports.loadBabelConfig = (function () {
    let babelRC = null;
    return function _getBabelRC({ projectRoot }) {
        if (babelRC !== null) {
            return babelRC;
        }
        babelRC = {};
        if (projectRoot) {
            // Check for various babel config files in the project root
            // TODO(EvanBacon): We might want to disable babelrc lookup when the user specifies `enableBabelRCLookup: false`.
            const possibleBabelRCPaths = ['.babelrc', '.babelrc.js', 'babel.config.js'];
            const foundBabelRCPath = possibleBabelRCPaths.find((configFileName) => node_fs_1.default.existsSync(node_path_1.default.resolve(projectRoot, configFileName)));
            // Extend the config if a babel config file is found
            if (foundBabelRCPath) {
                babelRC.extends = node_path_1.default.resolve(projectRoot, foundBabelRCPath);
            }
        }
        // Use the default preset for react-native if no babel config file is found
        if (!babelRC.extends) {
            babelRC.presets = [require('babel-preset-expo')];
        }
        return babelRC;
    };
})();
//# sourceMappingURL=loadBabelConfig.js.map