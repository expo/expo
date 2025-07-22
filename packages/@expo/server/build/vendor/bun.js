"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = createRequestHandler;
const index_1 = require("@expo/server");
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
function createRequestHandler({ build }, setup) {
    const handleRequest = (0, index_1.createRequestHandler)(build, setup);
    
    return handleRequest;
}