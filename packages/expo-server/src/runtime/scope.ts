export interface RequestAPI {
  origin?: string;
  environment?: string | null;
  waitUntil?(promise: Promise<unknown>): void;
  deferTask?(fn: () => Promise<unknown>): void;
}

export interface ScopeDefinition<Scope extends RequestAPI = any> {
  getStore(): Scope | undefined;
  run<R>(scope: Scope, runner: () => R): R;
  run<R, TArgs extends any[]>(scope: Scope, runner: (...args: TArgs) => R, ...args: TArgs): R;
}

// NOTE(@kitten): When multiple versions of `@expo/server` are bundled, we still want to reuse the same scope definition
const scopeSymbol = Symbol.for('expoServerRuntime');
const sharedScope: { [scopeSymbol]?: { current: ScopeDefinition | null } } & typeof globalThis =
  globalThis;

const scopeRef: { current: ScopeDefinition<RequestAPI> | null } =
  sharedScope[scopeSymbol] ||
  (sharedScope[scopeSymbol] = {
    current: null,
  });

export { scopeRef };
