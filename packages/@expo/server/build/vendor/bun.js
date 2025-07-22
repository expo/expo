"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = createRequestHandler;
const index_1 = require("../index");
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
function createRequestHandler({ build }, setup) {
    return (0, index_1.createRequestHandler)(build, setup);
}
//# sourceMappingURL=bun.js.map