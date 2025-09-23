import { AsyncLocalStorage } from 'node:async_hooks';

import type { RequestAPI } from './api';

const scopeSymbol = Symbol.for('expoServerRuntime');

export function getRequestScopeSingleton(): AsyncLocalStorage<RequestAPI> {
  const setup: { [scopeSymbol]?: AsyncLocalStorage<RequestAPI> } & typeof globalThis = globalThis;
  return setup[scopeSymbol] ?? (setup[scopeSymbol] = new AsyncLocalStorage());
}

export function getRequestScope() {
  return getRequestScopeSingleton().getStore();
}
