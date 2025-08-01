"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = createRequestHandler;
const index_1 = require("../index");
const node_1 = require("../runtime/node");
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
function createRequestHandler({ build }, setup = {}) {
    return (0, index_1.createRequestHandler)({
        getRoutesManifest: (0, node_1.getRoutesManifest)(build),
        getHtml: (0, node_1.getHtml)(build),
        getApiRoute: (0, node_1.getApiRoute)(build),
        logApiRouteExecutionError: (0, node_1.logApiRouteExecutionError)(),
        handleApiRouteError: (0, node_1.handleApiRouteError)(),
        ...setup,
    });
}
//# sourceMappingURL=bun.js.map