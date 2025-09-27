"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUpPackageJsonPath = void 0;
/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const findUpPackageJsonPath = (root) => {
    for (let dir = root; path_1.default.dirname(dir) !== dir; dir = path_1.default.dirname(dir)) {
        const file = path_1.default.resolve(dir, 'package.json');
        if (fs_1.default.existsSync(file)) {
            return file;
        }
    }
    throw new Error(`Cannot find package.json from "${root}"`);
};
exports.findUpPackageJsonPath = findUpPackageJsonPath;
//# sourceMappingURL=findUpPackageJsonPath.js.map