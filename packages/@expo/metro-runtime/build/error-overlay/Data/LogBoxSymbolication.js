"use strict";
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.symbolicate = exports.deleteStack = void 0;
const symbolicateStackTrace_1 = __importDefault(require("../modules/symbolicateStackTrace"));
const cache = new Map();
/**
 * Sanitize because sometimes, `symbolicateStackTrace` gives us invalid values.
 */
const sanitize = ({ stack: maybeStack, codeFrame, }) => {
    if (!Array.isArray(maybeStack)) {
        throw new Error('Expected stack to be an array.');
    }
    const stack = [];
    for (const maybeFrame of maybeStack) {
        let collapse = false;
        if ('collapse' in maybeFrame) {
            if (typeof maybeFrame.collapse !== 'boolean') {
                throw new Error('Expected stack frame `collapse` to be a boolean.');
            }
            collapse = maybeFrame.collapse;
        }
        stack.push({
            arguments: [],
            column: maybeFrame.column,
            file: maybeFrame.file,
            lineNumber: maybeFrame.lineNumber,
            methodName: maybeFrame.methodName,
            collapse,
        });
    }
    return { stack, codeFrame };
};
function deleteStack(stack) {
    cache.delete(stack);
}
exports.deleteStack = deleteStack;
function symbolicate(stack) {
    let promise = cache.get(stack);
    if (promise == null) {
        promise = (0, symbolicateStackTrace_1.default)(stack).then(sanitize);
        cache.set(stack, promise);
    }
    return promise;
}
exports.symbolicate = symbolicate;
//# sourceMappingURL=LogBoxSymbolication.js.map