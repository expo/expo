"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoResponse = exports.ExpoRequest = void 0;
exports.installGlobals = installGlobals;
/* eslint-disable no-var */
require("./assertion");
/** @deprecated */
exports.ExpoRequest = Request;
/** @deprecated */
exports.ExpoResponse = Response;
/** Use global polyfills from undici */
function installGlobals() {
    // NOTE(@kitten): We defer requiring `undici` here
    // The require here is only fine as long as we only have CommonJS entrypoints
    const { File: undiciFile, fetch: undiciFetch, FormData: undiciFormData, Headers: undiciHeaders, Request: undiciRequest, Response: undiciResponse, } = require('undici');
    globalThis.File = undiciFile;
    globalThis.Headers = undiciHeaders;
    globalThis.Request = undiciRequest;
    globalThis.Response = undiciResponse;
    globalThis.fetch = undiciFetch;
    globalThis.FormData = undiciFormData;
    // Add deprecated globals for `Expo` aliased classes
    globalThis.ExpoRequest = undiciRequest;
    globalThis.ExpoResponse = undiciResponse;
}
//# sourceMappingURL=environment.js.map