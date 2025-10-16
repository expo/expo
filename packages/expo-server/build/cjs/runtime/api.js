"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusError = void 0;
exports.origin = origin;
exports.environment = environment;
exports.runTask = runTask;
exports.deferTask = deferTask;
exports.setResponseHeaders = setResponseHeaders;
const scope_1 = require("./scope");
function enforcedRequestScope() {
    const scope = scope_1.scopeRef.current?.getStore();
    if (scope === undefined) {
        throw new Error('Invalid server runtime API call. Runtime APIs can only be called during ongoing requests.\n' +
            '- You may be calling this API in the global scope.\n' +
            '- You might be calling this API outside of a promise scoped to a request.\n' +
            '- You might have more than one copy of this API installed.');
    }
    return scope;
}
function assertSupport(name, v) {
    if (v === undefined) {
        throw new Error(`Unsupported server runtime API call: ${name}. This API is not supported in your current environment.`);
    }
    return v;
}
var error_1 = require("./error");
Object.defineProperty(exports, "StatusError", { enumerable: true, get: function () { return error_1.StatusError; } });
/** Returns the current request's origin URL.
 *
 * This typically returns the request's `Origin` header, which contains the
 * request origin URL or defaults to `null`.
 * @returns A request origin
 */
function origin() {
    return assertSupport('origin()', enforcedRequestScope().origin);
}
/** Returns the request's environment, if the server runtime supports this.
 *
 * In EAS Hosting, the returned environment name is the
 * [alias or deployment identifier](https://docs.expo.dev/eas/hosting/deployments-and-aliases/),
 * but the value may differ for other providers.
 *
 * @returns A request environment name, or `null` for production.
 */
function environment() {
    return assertSupport('environment()', enforcedRequestScope().environment);
}
/** Runs a task immediately and instructs the runtime to complete the task.
 *
 * A request handler may be terminated as soon as the client has finished the full `Response`
 * and unhandled promise rejections may not be logged properly. To run tasks concurrently to
 * a request handler and keep the request alive until the task is completed, pass a task
 * function to `runTask` instead. The request handler will be kept alive until the task
 * completes.
 *
 * @param fn - A task function to execute. The request handler will be kept alive until this task finishes.
 */
function runTask(fn) {
    assertSupport('runTask()', enforcedRequestScope().waitUntil)(fn());
}
/** Defers a task until after a response has been sent.
 *
 * This only calls the task function once the request handler has finished resolving a `Response`
 * and keeps the request handler alive until the task is completed. This is useful to run non-critical
 * tasks after the request handler, for example to log analytics datapoints. If the request handler
 * rejects with an error, deferred tasks won't be executed.
 *
 * @param fn - A task function to execute after the request handler has finished.
 */
function deferTask(fn) {
    assertSupport('deferTask()', enforcedRequestScope().deferTask)(fn);
}
/** Sets headers on the `Response` the current request handler will return.
 *
 * This only updates the headers once the request handler has finished and resolved a `Response`.
 * It will either receive a set of `Headers` or an equivalent object containing headers, which will
 * be merged into the response's headers once it's returned.
 *
 * @param updateHeaders - A `Headers` object, a record of headers, or a function that receives `Headers` to be updated or can return a `Headers` object that will be merged into the response headers.
 */
function setResponseHeaders(updateHeaders) {
    assertSupport('setResponseHeaders()', enforcedRequestScope().setResponseHeaders)(updateHeaders);
}
//# sourceMappingURL=api.js.map