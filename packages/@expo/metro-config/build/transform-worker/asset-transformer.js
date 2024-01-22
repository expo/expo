"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the upstream transformer, but with modifications made for web production hashing.
 * https://github.com/facebook/metro/blob/412771475c540b6f85d75d9dcd5a39a6e0753582/packages/metro-transform-worker/src/utils/assetTransformer.js#L1
 */
const util_1 = require("metro/src/Bundler/util");
const node_path_1 = __importDefault(require("node:path"));
const getAssets_1 = require("./getAssets");
async function transform({ filename, options }, assetRegistryPath, assetDataPlugins) {
    options ??= options || {
        platform: '',
        projectRoot: '',
        inlineRequires: false,
        minify: false,
    };
    const absolutePath = node_path_1.default.resolve(options.projectRoot, filename);
    const data = await (0, getAssets_1.getUniversalAssetData)(absolutePath, filename, assetDataPlugins, options.platform, options.publicPath);
    return {
        ast: (0, util_1.generateAssetCodeFileAst)(assetRegistryPath, data),
    };
}
exports.transform = transform;
//# sourceMappingURL=asset-transformer.js.map