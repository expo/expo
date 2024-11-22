import { expect } from '@jest/globals';
import type { MatcherFunction } from 'expect';
import type { MatcherHintOptions } from 'jest-matcher-utils';
import { platform } from 'node:process';

/**
 * Match a path using a string or regular expression.
 * This matcher normalizes UNIX paths to POSIX paths, to simplify path assertions on different platforms.
 */
const toMatchPath: MatcherFunction<[path: string | RegExp]> = function (received, expected) {
  // This matcher is based on: https://github.com/jestjs/jest/blob/22029ba06b69716699254bb9397f2b3bc7b3cf3b/packages/expect/src/matchers.ts#L818-L894
  const { matcherErrorMessage, matcherHint, printExpected, printReceived, printWithType } =
    this.utils;
  const matcherName = 'toMatchPath';
  const options: MatcherHintOptions = {
    isNot: this.isNot,
    promise: this.promise,
  };

  if (typeof received !== 'string') {
    throw new TypeError(
      matcherErrorMessage(
        matcherHint(matcherName, undefined, undefined, options),
        `${printReceived('received')} value must be a string`,
        printWithType('Received', received, printReceived)
      )
    );
  }

  // Normalize possible UNIX paths to POSIX paths, simplifing path assertions on different platforms.
  const receivedPath = platform === 'win32' ? received.replace(/\\/g, '/') : received;

  const pass =
    typeof expected === 'string'
      ? receivedPath === expected
      : new RegExp(expected).test(receivedPath);

  return {
    pass,
    message: () => {
      const labelExpected = `Expected ${typeof expected === 'string' ? 'path' : 'pattern'}: ${this.isNot ? 'not ' : ''}`;
      const labelReceived = `Received path:`.padEnd(labelExpected.length, ' ');
      const labelNormalized = `Normalized path:`.padEnd(labelExpected.length, ' ');

      let message =
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `${labelExpected}${printExpected(expected)}\n` +
        `${labelReceived}${printReceived(received)}`;

      if (received !== receivedPath) {
        message += `\n${labelNormalized}${printReceived(receivedPath)}`;
      }

      return message;
    },
  };
};

expect.extend({
  toMatchPath,
});

declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Match a path using a string or regular expression.
       * This matcher normalizes UNIX paths to POSIX paths, to simplify path assertions on different platforms.
       */
      toMatchPath(path: string | RegExp): R;
    }
  }
}
