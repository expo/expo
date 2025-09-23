import { AsyncLocalStorage } from 'node:async_hooks';

import type { RequestAPI } from './api';
import { errorToResponse } from './error';
import { importMetaRegistry } from '../utils/importMetaRegistry';

const scopeSymbol = Symbol.for('expoServerRuntime');

function getRequestScopeSingleton(): AsyncLocalStorage<RequestAPI> {
  const setup: { [scopeSymbol]?: AsyncLocalStorage<RequestAPI> } & typeof globalThis = globalThis;
  return setup[scopeSymbol] ?? (setup[scopeSymbol] = new AsyncLocalStorage());
}

interface RequestAPISetup extends RequestAPI {
  origin?: string;
  environment?: string | null;
  waitUntil?(promise: Promise<unknown>): void;
}

export function getRequestScope() {
  return getRequestScopeSingleton().getStore();
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
  const requestScope = getRequestScopeSingleton();
  return async (run, ...args) => {
    const setup = makeRequestAPISetup(...args);
    const { waitUntil } = setup;

    const scope = {
      ...setup,
      origin: setup.origin,
      environment: setup.environment,
      waitUntil,
      deferTask: setup.deferTask,
    } satisfies RequestAPI;

    const deferredTasks: (() => Promise<unknown>)[] = [];
    if (waitUntil && !scope.deferTask) {
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

    if (waitUntil && deferredTasks.length) {
      deferredTasks.forEach((fn) => waitUntil(fn()));
    }

    return result;
  };
}
