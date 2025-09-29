"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoError = void 0;
exports.createRequestHandler = createRequestHandler;
const node_async_hooks_1 = require("node:async_hooks");
const runtime_1 = require("../runtime");
const abstract_1 = require("./abstract");
const workerd_1 = require("./environment/workerd");
var abstract_2 = require("./abstract");
Object.defineProperty(exports, "ExpoError", { enumerable: true, get: function () { return abstract_2.ExpoError; } });
const STORE = new node_async_hooks_1.AsyncLocalStorage();
/**
 * Returns a request handler for EAS Hosting deployments.
 */
function createRequestHandler(params, setup) {
    const makeRequestAPISetup = (request, _env, ctx) => ({
        origin: request.headers.get('Origin') || 'null',
        environment: request.headers.get('eas-environment') || null,
        waitUntil: ctx.waitUntil?.bind(ctx),
    });
    const run = (0, runtime_1.createRequestScope)(STORE, makeRequestAPISetup);
    const onRequest = (0, abstract_1.createRequestHandler)({
        ...(0, workerd_1.createWorkerdEnv)(params),
        ...setup,
    });
    return (request, env, ctx) => run(onRequest, request, env, ctx);
}
//# sourceMappingURL=eas.js.map