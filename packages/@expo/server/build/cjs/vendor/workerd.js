"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoError = void 0;
exports.createRequestHandler = createRequestHandler;
const abstract_1 = require("./abstract");
const workerd_1 = require("./environment/workerd");
var abstract_2 = require("./abstract");
Object.defineProperty(exports, "ExpoError", { enumerable: true, get: function () { return abstract_2.ExpoError; } });
/**
 * Returns a request handler for Workerd deployments.
 */
function createRequestHandler(params, setup) {
    const run = (0, workerd_1.createWorkerdRequestScope)(params);
    const onRequest = (0, abstract_1.createRequestHandler)({
        ...(0, workerd_1.createWorkerdEnv)(params),
        ...setup,
    });
    return (request, env, ctx) => run(onRequest, request, env, ctx);
}
//# sourceMappingURL=workerd.js.map