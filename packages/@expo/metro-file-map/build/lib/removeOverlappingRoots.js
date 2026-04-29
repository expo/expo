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
exports.default = removeOverlappingRoots;
const path_1 = __importDefault(require("path"));
function removeOverlappingRoots(roots) {
    const sorted = roots
        .map((r) => path_1.default.resolve(r))
        .sort((a, b) => {
        const aRoot = a + path_1.default.sep;
        const bRoot = b + path_1.default.sep;
        return aRoot < bRoot ? -1 : aRoot > bRoot ? 1 : 0;
    });
    if (sorted.length === 0) {
        return sorted;
    }
    const result = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        const rootPath = sorted[i] + path_1.default.sep;
        const prevPath = result[result.length - 1] + path_1.default.sep;
        if (!rootPath.startsWith(prevPath)) {
            result.push(sorted[i]);
        }
    }
    return result;
}
