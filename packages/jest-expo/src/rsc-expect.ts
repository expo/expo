import 'server-only';

import matchers from 'expect/build/matchers';
import React from 'react';

import { streamToString, renderJsxToFlightStringAsync } from './rsc-utils';

matchers.customTesters = [];

async function resolveFlightInputAsync(data: React.ReactNode | ReadableStream) {
  if ('getReader' in data) {
    return (await streamToString(data)).trim();
  }
  const resolved = await renderJsxToFlightStringAsync(data);
  return resolved.trim();
}

function flightInputAsStringOrPromise(data: any) {
  if (typeof data === 'string') {
    return data;
  }
  return new Promise(async (res, rej) => {
    resolveFlightInputAsync(data).then(res).catch(rej);
  });
}

expect.extend({
  toMatchFlight(data: string | React.ReactNode | ReadableStream, input: string) {
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
});

declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Given a JSX node, flight string, or ReadableStream, this will evaluate using a constant behavior (similar to Expo Router) and compare to a string.
       *
       * @example
       * expect(<div />).toMatchFlight('{"type":"div","props":{},"children":[]}');
       *
       */
      toMatchFlight(data: string): R;
    }
  }
}
