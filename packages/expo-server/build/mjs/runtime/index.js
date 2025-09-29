import { errorToResponse } from './error';
import { scopeRef } from './scope';
import { importMetaRegistry } from '../utils/importMetaRegistry';
function setupRuntime() {
    try {
        Object.defineProperty(globalThis, 'origin', {
            enumerable: true,
            configurable: true,
            get() {
                return scopeRef.current?.getStore()?.origin || 'null';
            },
        });
    }
    catch { }
    try {
        Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
            enumerable: true,
            configurable: true,
            get() {
                return importMetaRegistry;
            },
        });
    }
    catch { }
}
export function createRequestScope(scopeDefinition, makeRequestAPISetup) {
    setupRuntime();
    // NOTE(@kitten): For long-running servers, this will always be a noop. It therefore
    // makes sense for us to provide a default that doesn't do anything.
    function defaultWaitUntil(promise) {
        promise.finally(() => { });
    }
    return async (run, ...args) => {
        // Initialize the scope definition which is used to isolate the runtime API between
        // requests. The implementation of scopes differs per runtime, and is only initialized
        // once the first request is received
        scopeRef.current = scopeDefinition;
        const setup = makeRequestAPISetup(...args);
        const { waitUntil = defaultWaitUntil } = setup;
        const scope = {
            ...setup,
            origin: setup.origin,
            environment: setup.environment,
            waitUntil,
            deferTask: setup.deferTask,
        };
        const deferredTasks = [];
        if (!scope.deferTask) {
            scope.deferTask = function deferTask(fn) {
                deferredTasks.push(fn);
            };
        }
        let result;
        try {
            result =
                scopeRef.current != null
                    ? await scopeRef.current.run(scope, () => run(...args))
                    : await run(...args);
        }
        catch (error) {
            if (error != null && error instanceof Error && 'status' in error) {
                return errorToResponse(error);
            }
            else {
                throw error;
            }
        }
        if (deferredTasks.length) {
            deferredTasks.forEach((fn) => waitUntil(fn()));
        }
        return result;
    };
}
//# sourceMappingURL=index.js.map