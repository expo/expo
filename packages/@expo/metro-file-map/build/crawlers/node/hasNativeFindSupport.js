"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = hasNativeFindSupport;
const child_process_1 = require("child_process");
async function hasNativeFindSupport() {
    try {
        return await new Promise((resolve) => {
            // Check the find binary supports the non-POSIX -iname parameter wrapped in parens.
            const args = ['.', '-type', 'f', '(', '-iname', '*.ts', '-o', '-iname', '*.js', ')'];
            const child = (0, child_process_1.spawn)('find', args, { cwd: __dirname });
            child.on('error', () => {
                resolve(false);
            });
            child.on('exit', (code) => {
                resolve(code === 0);
            });
        });
    }
    catch {
        return false;
    }
}
