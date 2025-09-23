"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusError = void 0;
exports.origin = origin;
exports.environment = environment;
exports.runTask = runTask;
exports.deferTask = deferTask;
const scope_1 = require("./scope");
function enforcedRequestScope() {
    const scope = (0, scope_1.getRequestScope)();
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
/** Returns the current request's origin URL
 * @remarks
 * This returns the request's Origin header, which contains the
 * request origin URL or defaults to `null`.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin
 */
function origin() {
    return assertSupport('origin()', enforcedRequestScope().origin);
}
/** Returns the currently specified "environment", if any is set up.
 * @remarks
 * The request's environment. When this is `null`, this by convention typically
 * signifies the production environment. This is typically customized via the
 * Expo server adapters, and will default to the current `alias` name in
 * EAS Hosting.
 */
function environment() {
    return assertSupport('environment()', enforcedRequestScope().environment);
}
/** Runs a task immediately and instructs the runtime to complete the task.
 * @remarks
 * Running a promise concurrently to the request doesn't usually guarantee that your
 * serverless function will continue executing the task. Passing the task to `runTask`
 * will attempt to keep the current invocation running until the task is completed.
 */
function runTask(fn) {
    assertSupport('runTask()', enforcedRequestScope().waitUntil)(fn());
}
/** Defers a task until after a response has been sent.
 * @remarks
 * After a response has been sent, if no error occurred, the tasks passed to `deferTask`
 * will be executed and the serverless function will be instructed to continue executing
 * the task until it has completed.
 */
function deferTask(fn) {
    assertSupport('deferTask()', enforcedRequestScope().deferTask)(fn);
}
//# sourceMappingURL=api.js.map