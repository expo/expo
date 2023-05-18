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
 */
const metro_transform_worker_1 = __importDefault(require("metro-transform-worker"));
const nativeCssTransform_1 = require("./nativeCssTransform");
const webCssTransform_1 = require("./webCssTransform");
async function transform(config, projectRoot, filename, data, options) {
    var _a, _b;
    const isCss = options.type !== "asset" && /\.(s?css|sass)$/.test(filename);
    // If the file is not CSS, then use the default behavior.
    if (!isCss) {
        return metro_transform_worker_1.default.transform(config, projectRoot, filename, data, options);
    }
    if ((_a = config.externallyManagedCss) === null || _a === void 0 ? void 0 : _a[filename]) {
        return metro_transform_worker_1.default.transform(config, projectRoot, filename, Buffer.from(`module.exports = require("${(_b = config.externallyManagedCss) === null || _b === void 0 ? void 0 : _b[filename]}")`), options);
    }
    if (options.platform === "web") {
        return (0, webCssTransform_1.webCssTransform)(config, projectRoot, filename, data, options);
    }
    else {
        return (0, nativeCssTransform_1.nativeCssTransform)(config, projectRoot, filename, data, options);
    }
}
exports.transform = transform;
/**
 * A custom Metro transformer that adds support for processing Expo-specific bundler features.
 * - Global CSS files on web.
 * - CSS Modules on web.
 * - TODO: Tailwind CSS on web.
 */
module.exports = {
    // Use defaults for everything that's not custom.
    ...metro_transform_worker_1.default,
    transform,
};
//# sourceMappingURL=index.js.map