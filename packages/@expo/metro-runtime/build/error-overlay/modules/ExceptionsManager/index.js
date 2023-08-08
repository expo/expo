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
const parseErrorStack_1 = __importDefault(require("../parseErrorStack"));
class SyntheticError extends Error {
    name = '';
}
/**
 * Handles the developer-visible aspect of errors and exceptions
 */
let exceptionID = 0;
function parseException(e, isFatal) {
    const stack = (0, parseErrorStack_1.default)(e?.stack);
    const currentExceptionID = ++exceptionID;
    const originalMessage = e.message || '';
    let message = originalMessage;
    if (e.componentStack != null) {
        message += `\n\nThis error is located at:${e.componentStack}`;
    }
    const namePrefix = e.name == null || e.name === '' ? '' : `${e.name}: `;
    if (!message.startsWith(namePrefix)) {
        message = namePrefix + message;
    }
    message = e.jsEngine == null ? message : `${message}, js engine: ${e.jsEngine}`;
    const data = {
        message,
        originalMessage: message === originalMessage ? null : originalMessage,
        name: e.name == null || e.name === '' ? null : e.name,
        componentStack: typeof e.componentStack === 'string' ? e.componentStack : null,
        stack,
        id: currentExceptionID,
        isFatal,
        extraData: {
            jsEngine: e.jsEngine,
            rawStack: e.stack,
        },
    };
    return {
        ...data,
        isComponentError: !!e.isComponentError,
    };
}
/**
 * Logs exceptions to the (native) console and displays them
 */
function handleException(e) {
    let error;
    if (e instanceof Error) {
        error = e;
    }
    else {
        // Workaround for reporting errors caused by `throw 'some string'`
        // Unfortunately there is no way to figure out the stacktrace in this
        // case, so if you ended up here trying to trace an error, look for
        // `throw '<error message>'` somewhere in your codebase.
        error = new SyntheticError(e);
    }
    require('../../LogBox').default.addException(parseException(error, true));
}
const ErrorUtils = {
    parseException,
    handleException,
    SyntheticError,
};
exports.default = ErrorUtils;
//# sourceMappingURL=index.js.map