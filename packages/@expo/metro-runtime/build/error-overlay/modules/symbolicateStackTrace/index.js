"use strict";
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
async function symbolicateStackTrace(stack) {
    const baseUrl = typeof window === 'undefined'
        ? process.env.EXPO_DEV_SERVER_ORIGIN
        : window.location.protocol + '//' + window.location.host;
    const response = await fetch(baseUrl + '/symbolicate', {
        method: 'POST',
        body: JSON.stringify({ stack }),
    });
    return await response.json();
}
exports.default = symbolicateStackTrace;
//# sourceMappingURL=index.js.map