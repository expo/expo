import 'server-only';

import matchers from 'expect/build/matchers';
import React from 'react';

import { streamToString, renderJsxToFlightStringAsync } from './rsc-utils';

matchers.customTesters = [];

expect.extend({
  toMatchFlight(data: string | React.ReactNode | ReadableStream, input: string) {
    if (typeof data === 'string') {
      return matchers.toEqual(data, input);
    }
    return new Promise(async (res, rej) => {
      if ('getReader' in data) {
        try {
          const resolved = (await streamToString(data)).trim();
          res(matchers.toEqual(resolved, input));
        } catch (e) {
          rej(e);
        }
      } else {
        try {
          const resolved = (await renderJsxToFlightStringAsync(data)).trim();
          res(matchers.toEqual(resolved, input));
        } catch (e) {
          rej(e);
        }
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
