"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAsync = void 0;
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
async function fetchAsync(url) {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            // No real reason for this but we try to use this format for everything.
            'expo-platform': 'web',
        },
    });
    return {
        body: await response.text(),
        status: response.status,
        headers: response.headers,
    };
}
exports.fetchAsync = fetchAsync;
//# sourceMappingURL=fetchAsync.js.map