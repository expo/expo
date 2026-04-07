"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getPlatformExtension;
// Extract platform extension: index.ios.js -> ios
function getPlatformExtension(file, platforms) {
    const last = file.lastIndexOf('.');
    const secondToLast = file.lastIndexOf('.', last - 1);
    if (secondToLast === -1) {
        return null;
    }
    const platform = file.substring(secondToLast + 1, last);
    return platforms.has(platform) ? platform : null;
}
