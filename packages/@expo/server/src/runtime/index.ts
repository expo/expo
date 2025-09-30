import type { RequestAPI } from './api';
import { errorToResponse } from './error';
import { type ScopeDefinition, scopeRef } from './scope';
import { importMetaRegistry } from '../utils/importMetaRegistry';

export interface RequestAPISetup extends RequestAPI {
  origin?: string;
  environment?: string | null;
  waitUntil?(promise: Promise<unknown>): void;
}

function setupRuntime() {
  try {
    Object.defineProperty(globalThis, 'origin', {
      enumerable: true,
      configurable: true,
      get() {
        return scopeRef.current?.getStore()?.origin || 'null';
      },
    });
  } catch {}
  try {
    Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
      enumerable: true,
      configurable: true,
      get() {
        return importMetaRegistry;
      },
    });
  } catch {}
}

type RequestContextFactory = (...args: any[]) => Partial<RequestAPISetup>;

type RequestScopeRunner<F extends RequestContextFactory> = (
  fn: (...args: Parameters<F>) => Promise<Response>,
  ...args: Parameters<F>
) => Promise<Response>;

export function createRequestScope<F extends RequestContextFactory>(
  scopeDefinition: ScopeDefinition,
  makeRequestAPISetup: F
): RequestScopeRunner<F> {
  setupRuntime();

  // NOTE(@kitten): For long-running servers, this will always be a noop. It therefore
  // makes sense for us to provide a default that doesn't do anything.
  function defaultWaitUntil(promise: Promise<unknown>): void {
    promise.finally(() => {});
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
    } satisfies RequestAPI;

    const deferredTasks: (() => Promise<unknown>)[] = [];
    if (!scope.deferTask) {
      scope.deferTask = function deferTask(fn) {
        deferredTasks.push(fn);
      };
    }

    let result: Response;
    try {
      result =
        scopeRef.current != null
          ? await scopeRef.current.run(scope, () => run(...args))
          : await run(...args);
    } catch (error) {
      if (error != null && error instanceof Error && 'status' in error) {
        return errorToResponse(error);
      } else {
        throw error;
      }
    }

    if (deferredTasks.length) {
      deferredTasks.forEach((fn) => waitUntil(fn()));
    }

    return result;
  };
}
