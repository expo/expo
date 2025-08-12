"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = createRequestHandler;
const index_1 = require("../index");
const workerd_1 = require("../runtime/workerd");
/**
 * Returns a request handler for Workerd deployments.
 */
function createRequestHandler({ build }, setup = {}) {
    return (0, index_1.createRequestHandler)({
        getRoutesManifest: (0, workerd_1.getRoutesManifest)(build),
        getHtml: (0, workerd_1.getHtml)(build),
        getApiRoute: (0, workerd_1.getApiRoute)(build),
        getMiddleware: (0, workerd_1.getMiddleware)(build),
        handleRouteError: (0, workerd_1.handleRouteError)(),
        ...setup,
    });
}
//# sourceMappingURL=workerd.js.map