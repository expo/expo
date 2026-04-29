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
let normalizePathSeparatorsToPosix;
if (path_1.default.sep === '/') {
    normalizePathSeparatorsToPosix = (filePath) => filePath;
}
else {
    normalizePathSeparatorsToPosix = (filePath) => filePath.replace(/\\/g, '/');
}
exports.default = normalizePathSeparatorsToPosix;
