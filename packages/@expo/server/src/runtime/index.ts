import { RequestAPI } from './api';
import { errorToResponse } from './error';
import { getRequestScope, getRequestScopeSingleton } from './scope';
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
        return getRequestScope()?.origin || 'null';
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
  makeRequestAPISetup: F
): RequestScopeRunner<F> {
  setupRuntime();

  // NOTE(@kitten): For long-running servers, this will always be a noop. It therefore
  // makes sense for us to provide a default that doesn't do anything.
  function defaultWaitUntil(promise: Promise<unknown>): void {
    promise.finally(() => {});
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
    } satisfies RequestAPI;

    const deferredTasks: (() => Promise<unknown>)[] = [];
    if (!scope.deferTask) {
      scope.deferTask = function deferTask(fn) {
        deferredTasks.push(fn);
      };
    }

    let result: Response;
    try {
      result = await requestScope.run(scope, () => run(...args));
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
