import { getRequestScope } from './scope';

function enforcedRequestScope(): RequestAPI {
  const scope = getRequestScope();
  if (scope === undefined) {
    throw new Error(
      'Invalid server runtime API call. Runtime APIs can only be called during ongoing requests.\n' +
        '- You may be calling this API in the global scope.\n' +
        '- You might be calling this API outside of a promise scoped to a request.\n' +
        +'- You might have more than one copy of this API installed.'
    );
  }
  return scope;
}

function assertSupport<T>(name: string, v: T | undefined): T {
  if (v === undefined) {
    throw new Error(
      `Unsupported server runtime API call: ${name}. This API is not supported in your current environment.`
    );
  }
  return v;
}

export interface RequestAPI {
  environment?: string | null;
  waitUntil?(promise: Promise<unknown>): void;
  deferTask?(fn: () => Promise<unknown>): void;
}

export function environment(): string | null {
  return assertSupport('environment()', enforcedRequestScope().environment);
}

export function runTask(fn: () => Promise<unknown>): void {
  assertSupport('runTask()', enforcedRequestScope().waitUntil)(fn());
}

export function deferTask(fn: () => Promise<unknown>): void {
  assertSupport('deferTask()', enforcedRequestScope().deferTask)(fn);
}
