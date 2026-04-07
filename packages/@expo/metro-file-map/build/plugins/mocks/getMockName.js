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
const MOCKS_PATTERN = path_1.default.sep + '__mocks__' + path_1.default.sep;
exports.default = (filePath) => {
    const mockPath = filePath.split(MOCKS_PATTERN)[1];
    return mockPath.substring(0, mockPath.lastIndexOf(path_1.default.extname(mockPath))).replaceAll('\\', '/');
};
