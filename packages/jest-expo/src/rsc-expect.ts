import 'server-only';

import matchers from 'expect/build/matchers';
import { toMatchSnapshot } from 'jest-snapshot';
import type { ReactNode } from 'react';

import { streamToString, renderJsxToFlightStringAsync } from './rsc-utils';

matchers.customTesters = [];

/** Resolve the JSX data source to string, from either streaming or JSX flight rendering */
async function resolveFlightInputAsync(data: ReactNode | ReadableStream): Promise<string> {
  return data && typeof data === 'object' && 'getReader' in data
    ? (await streamToString(data)).trim()
    : (await renderJsxToFlightStringAsync(data)).trim();
}

/** Return the resolved JSX flight input as string, or string promise */
function flightInputAsStringOrPromise(data: ReactNode | ReadableStream): string | Promise<string> {
  return typeof data === 'string' ? data : resolveFlightInputAsync(data);
}

expect.extend({
  toMatchFlight(data: ReactNode | ReadableStream, input: string) {
    const resolved = flightInputAsStringOrPromise(data);

    if (typeof resolved === 'string') {
      return matchers.toEqual(resolved, input);
    }

    return new Promise(async (res, rej) => {
      try {
        const resolvedString = await resolved;
        res(matchers.toEqual(resolvedString, input));
      } catch (e) {
        rej(e);
      }
    });
  },
  async toMatchFlightSnapshot(this: any, data: ReactNode | ReadableStream) {
    const resolved = await flightInputAsStringOrPromise(data);
    return toMatchSnapshot.call(this, resolved);
  },
});
