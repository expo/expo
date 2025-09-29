import { errorToResponse } from './error';
import { getRequestScope, getRequestScopeSingleton } from './scope';
import { importMetaRegistry } from '../utils/importMetaRegistry';
function setupRuntime() {
    try {
        Object.defineProperty(globalThis, 'origin', {
            enumerable: true,
            configurable: true,
            get() {
                return getRequestScope()?.origin || 'null';
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
export function createRequestScope(makeRequestAPISetup) {
    setupRuntime();
    // NOTE(@kitten): For long-running servers, this will always be a noop. It therefore
    // makes sense for us to provide a default that doesn't do anything.
    function defaultWaitUntil(promise) {
        promise.finally(() => { });
    }
    const requestScope = getRequestScopeSingleton();
    return async (run, ...args) => {
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
            result = await requestScope.run(scope, () => run(...args));
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