import 'server-only';

import { expect } from '@jest/globals';
import { toMatchSnapshot } from 'jest-snapshot';
import type { ReadableStream } from 'node:stream/web';
import type { ReactNode } from 'react';

import { streamToString, renderJsxToFlightStringAsync } from './rsc-utils';

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
  // Types and jsdocs are defined in ./index.d.ts
  toMatchFlight(data: ReactNode | ReadableStream, input: string) {
    const resolvedStringOrPromise = flightInputAsStringOrPromise(data);

    const createTestResult = (flightInput: string) => {
      // Only pass when the flightInput "equals" the input string
      const pass = flightInput === input;
      return {
        pass,
        message: () => {
          const received = this.utils.printReceived(resolvedStringOrPromise);
          const expected = this.utils.printExpected(input);
          return pass
            ? `expected RSC flight ${received} NOT to equal ${expected}`
            : `expected RSC flight ${received} to equal ${expected}`;
        },
      };
    };

    // Handle both sync and async resolved strings
    return typeof resolvedStringOrPromise === 'string'
      ? createTestResult(resolvedStringOrPromise)
      : resolvedStringOrPromise.then(createTestResult);
  },

  // Types and jsdocs are defined in ./index.d.ts
  async toMatchFlightSnapshot(data: ReactNode | ReadableStream) {
    // See: https://jestjs.io/docs/expect#async
    Object.defineProperty(this, 'error', { value: new Error() });

    const resolvedString = await flightInputAsStringOrPromise(data);
    // @ts-expect-error - Snapshot contexts have an additional snapshotState, which is handled by Jest
    return toMatchSnapshot.call(this, resolvedString);
  },
});
