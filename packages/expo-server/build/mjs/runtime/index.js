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
        const deferredTasks = [];
        const responseHeadersUpdates = [];
        const scope = {
            ...setup,
            origin: setup.origin,
            environment: setup.environment,
            waitUntil,
            deferTask: setup.deferTask,
            setResponseHeaders(updateHeaders) {
                responseHeadersUpdates.push(updateHeaders);
            },
        };
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
            if (error != null && error instanceof Response && !error.bodyUsed) {
                result = error;
            }
            else if (error != null && error instanceof Error && 'status' in error) {
                return errorToResponse(error);
            }
            else {
                throw error;
            }
        }
        deferredTasks.forEach((fn) => {
            const maybePromise = fn();
            if (maybePromise != null)
                waitUntil(maybePromise);
        });
        for (const updateHeaders of responseHeadersUpdates) {
            let headers = result.headers;
            if (typeof updateHeaders === 'function') {
                headers = updateHeaders(result.headers) || headers;
            }
            else if (updateHeaders instanceof Headers) {
                headers = updateHeaders;
            }
            else if (typeof updateHeaders === 'object' && updateHeaders) {
                for (const headerName in updateHeaders) {
                    if (Array.isArray(updateHeaders[headerName])) {
                        for (const headerValue of updateHeaders[headerName]) {
                            headers.append(headerName, headerValue);
                        }
                    }
                    else if (updateHeaders[headerName] != null) {
                        headers.set(headerName, updateHeaders[headerName]);
                    }
                }
            }
            if (headers !== result.headers) {
                for (const [headerName, headerValue] of headers) {
                    result.headers.set(headerName, headerValue);
                }
            }
        }
        return result;
    };
}
//# sourceMappingURL=index.js.map