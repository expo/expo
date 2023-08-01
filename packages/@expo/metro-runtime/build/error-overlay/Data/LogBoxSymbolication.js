/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import symbolicateStackTrace from '../modules/symbolicateStackTrace';
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
export function deleteStack(stack) {
    cache.delete(stack);
}
export function symbolicate(stack) {
    let promise = cache.get(stack);
    if (promise == null) {
        promise = symbolicateStackTrace(stack).then(sanitize);
        cache.set(stack, promise);
    }
    return promise;
}
//# sourceMappingURL=LogBoxSymbolication.js.map