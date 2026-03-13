"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respond = exports.convertRequest = exports.ExpoError = void 0;
exports.createRequestHandler = createRequestHandler;
const node_async_hooks_1 = require("node:async_hooks");
const abstract_1 = require("./abstract");
const node_1 = require("./environment/node");
const http_1 = require("./http");
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
    async function requestHandler(request) {
        try {
            return await run(onRequest, request);
        }
        catch (error) {
            const handleRouteError = setup?.handleRouteError;
            if (handleRouteError && error != null && typeof error === 'object') {
                try {
                    return await handleRouteError(error);
                }
                catch {
                    // Rethrow original error below
                }
            }
            throw error;
        }
    }
    return async (req, res, next) => {
        if (!req?.url || !req.method) {
            return next();
        }
        try {
            const request = (0, http_1.convertRequest)(req, res);
            const response = await requestHandler(request);
            await (0, http_1.respond)(res, response);
        }
        catch (error) {
            // Express doesn't support async functions, so we have to pass along the
            // error manually using next().
            next(error);
        }
    };
}
var http_2 = require("./http");
Object.defineProperty(exports, "convertRequest", { enumerable: true, get: function () { return http_2.convertRequest; } });
Object.defineProperty(exports, "respond", { enumerable: true, get: function () { return http_2.respond; } });
//# sourceMappingURL=express.js.map