import { AsyncLocalStorage } from 'node:async_hooks';

import type { RequestAPI } from './api';

const scopeSymbol = Symbol.for('expoServerRuntime');

function getRequestScopeSingleton(): AsyncLocalStorage<RequestAPI> {
  const setup: { [scopeSymbol]?: AsyncLocalStorage<RequestAPI> } & typeof globalThis = globalThis;
  return setup[scopeSymbol] ?? (setup[scopeSymbol] = new AsyncLocalStorage());
}

interface RequestAPISetup extends RequestAPI {
  environment?: string | null;
  waitUntil?(promise: Promise<unknown>): void;
}

export function getRequestScope() {
  return getRequestScopeSingleton().getStore();
}

type RequestContextFactory = (...args: any[]) => Partial<RequestAPISetup>;

type RequestScopeRunner<F extends RequestContextFactory> = <R>(
  fn: (...args: Parameters<F>) => Promise<R>,
  ...args: Parameters<F>
) => Promise<R>;

export function createRequestScope<F extends RequestContextFactory>(
  makeRequestAPISetup: F
): RequestScopeRunner<F> {
  const requestScope = getRequestScopeSingleton();
  return async (run, ...args) => {
    const setup = makeRequestAPISetup(...args);
    const { waitUntil } = setup;

    const scope = {
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

    const result = await requestScope.run(scope, () => run(...args));

    if (waitUntil && deferredTasks.length) {
      deferredTasks.forEach((fn) => waitUntil(fn()));
    }

    return result;
  };
}
