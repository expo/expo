"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoError = void 0;
exports.createRequestHandler = createRequestHandler;
const node_async_hooks_1 = require("node:async_hooks");
const abstract_1 = require("./abstract");
const node_1 = require("./environment/node");
var abstract_2 = require("./abstract");
Object.defineProperty(exports, "ExpoError", { enumerable: true, get: function () { return abstract_2.ExpoError; } });
const STORE = new node_async_hooks_1.AsyncLocalStorage();
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
function createRequestHandler(params, setup) {
    const run = (0, node_1.createNodeRequestScope)(STORE, params);
    const onRequest = (0, abstract_1.createRequestHandler)({
        ...(0, node_1.createNodeEnv)(params),
        ...setup,
    });
    return (request) => run(onRequest, request);
}
//# sourceMappingURL=bun.js.map