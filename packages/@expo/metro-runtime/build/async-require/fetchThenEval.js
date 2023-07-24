"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchThenEvalAsync = void 0;
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const fetchAsync_1 = require("./fetchAsync");
/**
 * Load a bundle for a URL using fetch + eval on native and script tag injection on web.
 *
 * @param bundlePath Given a statement like `import('./Bacon')` `bundlePath` would be `Bacon`.
 */
function fetchThenEvalAsync(url) {
    return (0, fetchAsync_1.fetchAsync)(url).then(({ body, headers }) => {
        var _a;
        if (((_a = headers === null || headers === void 0 ? void 0 : headers.has) === null || _a === void 0 ? void 0 : _a.call(headers, "Content-Type")) != null &&
            headers.get("Content-Type").includes("application/json")) {
            // Errors are returned as JSON.
            throw new Error(JSON.parse(body).message || `Unknown error fetching '${url}'`);
        }
        // NOTE(EvanBacon): All of this code is ignored in development mode at the root.
        // Some engines do not support `sourceURL` as a comment. We expose a
        // `globalEvalWithSourceUrl` function to handle updates in that case.
        if (global.globalEvalWithSourceUrl) {
            global.globalEvalWithSourceUrl(body, url);
        }
        else {
            // eslint-disable-next-line no-eval
            eval(body);
        }
    });
}
exports.fetchThenEvalAsync = fetchThenEvalAsync;
//# sourceMappingURL=fetchThenEval.js.map